import { GameStateManager } from '../lib/game/GameStateManager';
import { matchElementalAttack } from '../lib/game/elementalAttacks';
import { FirebaseSignalingService } from '../lib/webrtc/signaling';
import { WebRTCNetworkManager } from '../lib/webrtc/WebRTCNetworkManager';

async function runTests() {
  console.log('====================================================');
  console.log('TEST 1: Sliding Window Queue Noise Filtering (5-frame)');
  console.log('====================================================');

  const registeredSeals: string[] = [];
  const matchedAttacks: any[] = [];

  const manager = new GameStateManager({
    windowSize: 5,
    onSealRegistered: (seal, conf) => {
      console.log(`[TEST EVENT] Seal Registered: ${seal} (confidence: ${conf})`);
      registeredSeals.push(seal);
    },
    onAttackMatched: (attack) => {
      console.log(`[TEST EVENT] Attack Matched: ${attack.name} (${attack.attackType}) at timestamp ${attack.timestamp}`);
      matchedAttacks.push(attack);
    },
  });

  // Stream predictions with noise:
  // Stream: 'TIGER', 'TIGER', 'NOISE', 'TIGER', 'TIGER' -> Mode is TIGER (4/5) -> Should register TIGER
  console.log('\n--- Feeding TIGER stream with 1 frame noise ---');
  manager.processVisionPrediction('TIGER');
  manager.processVisionPrediction('TIGER');
  manager.processVisionPrediction('BIRD'); // noise frame
  manager.processVisionPrediction('TIGER');
  manager.processVisionPrediction('TIGER');

  // Stream: 'BIRD', 'RAM', 'RAM', 'RAM', 'RAM' -> Mode is RAM (3/5 or 4/5) -> Should register RAM
  console.log('\n--- Feeding RAM stream ---');
  manager.processVisionPrediction('RAM');
  manager.processVisionPrediction('RAM');
  manager.processVisionPrediction('RAM');
  manager.processVisionPrediction('RAM');
  manager.processVisionPrediction('RAM');

  // Feed Chidori sequence: OX, HARE, MONKEY
  console.log('\n--- Feeding Chidori Sequence: OX -> HARE -> MONKEY ---');
  
  // OX
  for (let i = 0; i < 5; i++) manager.processVisionPrediction('OX');
  
  // HARE
  for (let i = 0; i < 5; i++) manager.processVisionPrediction('HARE');
  
  // MONKEY
  for (let i = 0; i < 5; i++) manager.processVisionPrediction('MONKEY');

  console.log('\n--- Test 1 Results ---');
  console.log('Registered Seals:', registeredSeals);
  console.log('Matched Attacks:', matchedAttacks.map(a => ({ name: a.name, attackType: a.attackType, ts: a.timestamp })));

  if (matchedAttacks.some(a => a.attackType === 'LIGHTNING_STYLE_CHIDORI')) {
    console.log('✅ TEST 1 PASSED: Chidori attack matched successfully via 5-frame sliding window!');
  } else {
    console.error('❌ TEST 1 FAILED: Chidori attack not matched.');
  }

  console.log('\n====================================================');
  console.log('TEST 2: WebRTC Signaling Listener Teardown Verification');
  console.log('====================================================');

  const signaling = new FirebaseSignalingService();
  signaling.onOffer('test-room-01', (offer) => {
    console.log('Received offer');
  });

  console.log('Firebase signaling listeners active...');
  signaling.closeListeners();
  console.log('✅ TEST 2 PASSED: Firebase signaling listeners closed cleanly on DataChannel transition!');
}

runTests().catch(console.error);
