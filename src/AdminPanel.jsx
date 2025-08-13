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
      await updateDoc(userRef, { unlocked: !current });
      setUsers(users => users.map(u => u.id === userId ? { ...u, unlocked: !current } : u));
    } catch (e) {
      alert('Failed to update user');
    }
  };

  if (loading) return <div>Loading users...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="bg-gray-800 p-6 rounded-xl max-w-2xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Admin Panel: Unlock Access</h2>
      <table className="w-full text-left">
        <thead>
          <tr>
            <th className="py-2">Email</th>
            <th className="py-2">Unlocked</th>
            <th className="py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id} className="border-t border-gray-700">
              <td className="py-2">{user.email}</td>
              <td className="py-2">{user.unlocked ? 'Yes' : 'No'}</td>
              <td className="py-2">
                <button
                  className={`px-3 py-1 rounded ${user.unlocked ? 'bg-red-500' : 'bg-green-500'} text-white`}
                  onClick={() => toggleUnlock(user.id, user.unlocked)}
                >
                  {user.unlocked ? 'Lock' : 'Unlock'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
