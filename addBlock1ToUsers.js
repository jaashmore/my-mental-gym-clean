const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function addBlock1ToAllUsers() {
  const usersRef = db.collection('artifacts').doc('mental-gym').collection('users');
  const snapshot = await usersRef.get();

  let batch = db.batch();
  let count = 0;

  snapshot.forEach(doc => {
    const data = doc.data();
    const paymentStatus = data.paymentStatus || {};
    if (paymentStatus.block1 === undefined) {
      paymentStatus.block1 = false; // or true if you want to unlock for all
      batch.update(doc.ref, { paymentStatus });
      count++;
    }
  });

  if (count > 0) {
    await batch.commit();
    console.log(`Updated ${count} users with block1 in paymentStatus.`);
  } else {
    console.log('All users already have block1 in paymentStatus.');
  }
}

addBlock1ToAllUsers().catch(console.error);