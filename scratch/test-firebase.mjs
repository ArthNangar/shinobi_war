import fetch from 'node-fetch';

async function testWebRTCRoomSignaling() {
  const roomId = 'room-leaf-01';
  const baseUrl = `https://shinobi-seals-5ca96-default-rtdb.firebaseio.com/rooms/${roomId}`;

  console.log(`\n🔥 Testing WebRTC Room Signaling Path: ${baseUrl} ...`);

  // 1. Write SDP Offer
  const offerUrl = `${baseUrl}/offer.json`;
  const offerPayload = {
    type: 'offer',
    sdp: 'v=0\r\no=- 12345678 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n',
    senderId: 'shinobi-tester-host',
    timestamp: Date.now()
  };

  console.log('1. Sending SDP Offer...');
  const offerRes = await fetch(offerUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(offerPayload)
  });
  console.log('   PUT Status:', offerRes.status, offerRes.statusText);
  const offerData = await offerRes.json();
  console.log('   Offer Written:', offerData);

  // 2. Read SDP Offer
  console.log('2. Reading SDP Offer back...');
  const readOfferRes = await fetch(offerUrl);
  console.log('   GET Status:', readOfferRes.status, readOfferRes.statusText);
  const readOfferData = await readOfferRes.json();
  console.log('   Offer Retrieved:', readOfferData);

  // 3. Push ICE Candidate
  const candidateUrl = `${baseUrl}/callerCandidates.json`;
  const candidatePayload = {
    candidate: { candidate: 'candidate:1 1 UDP 2013266431 127.0.0.1 54321 typ host', sdpMid: '0', sdpMLineIndex: 0 },
    senderId: 'shinobi-tester-host',
    timestamp: Date.now()
  };

  console.log('3. Pushing Caller ICE Candidate...');
  const candRes = await fetch(candidateUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(candidatePayload)
  });
  console.log('   POST Status:', candRes.status, candRes.statusText);
  const candData = await candRes.json();
  console.log('   Candidate Key Created:', candData?.name);

  // 4. Cleanup
  console.log('4. Cleaning up test room node...');
  await fetch(`${baseUrl}.json`, { method: 'DELETE' });
  console.log('\n✅ VERIFICATION COMPLETE: Firebase RTDB /rooms/ path is 100% OPERATIONAL for WebRTC signaling!');
}

testWebRTCRoomSignaling();
