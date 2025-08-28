import React, { useState, useEffect } from 'react';
import { getFirestore, doc, getDocs, collection, updateDoc } from 'firebase/firestore';

export default function AdminPanel({ db, appId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!db || !appId) return;
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const usersCol = collection(db, 'artifacts', appId, 'users');
        const snapshot = await getDocs(usersCol);
        const userList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(userList);
      } catch (e) {
        setError('Failed to fetch users');
      }
      setLoading(false);
    };
    fetchUsers();
  }, [db, appId]);

  const toggleUnlock = async (userId, current) => {
  try {
    const userRef = doc(db, 'artifacts', appId, 'users', userId);
    if (!current) {
      // Unlock: set unlocked true and all payment blocks true
      await updateDoc(userRef, {
        unlocked: true,
        paymentStatus: {
          block1: true,
          block2: true,
          block3: true,
          gamePlanUnlocked: true
        }
      });
      setUsers(users => users.map(u => u.id === userId ? { ...u, unlocked: true, paymentStatus: { block1: true, block2: true, block3: true, gamePlanUnlocked: true } } : u));
    } else {
      // Lock: set unlocked false and all payment blocks false
      await updateDoc(userRef, {
        unlocked: false,
        paymentStatus: {
          block1: false,
          block2: false,
          block3: false,
          gamePlanUnlocked: false
        }
      });
      setUsers(users => users.map(u => u.id === userId ? { ...u, unlocked: false, paymentStatus: { block1: false, block2: false, block3: false, gamePlanUnlocked: false } } : u));
    }
  } catch (e) {
    alert('Failed to update user');
  }
};