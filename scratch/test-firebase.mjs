async function testFirebase() {
  const url = 'https://shinobi-seals-5ca96-default-rtdb.firebaseio.com/rooms/test.json';
  try {
    const putRes = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true, timestamp: Date.now() }),
    });
    console.log('PUT Status:', putRes.status, putRes.statusText);
    const putData = await putRes.text();
    console.log('PUT Output:', putData);

    const getRes = await fetch(url);
    console.log('GET Status:', getRes.status, getRes.statusText);
    const getData = await getRes.text();
    console.log('GET Output:', getData);
  } catch (err) {
    console.error('Firebase test error:', err);
  }
}

testFirebase();
