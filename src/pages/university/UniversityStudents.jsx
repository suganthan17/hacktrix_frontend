import React, { useEffect, useState } from "react";
import UniversitySidebar from "../../components/UniversitySidebar";
import { BASE_URL } from "../../config";

export default function UniversityStudents({ courseId }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/api/enrollments/${courseId}/students`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch students");
        const data = await res.json();
        setStudents(data);
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };
    if (courseId) fetchStudents();
  }, [courseId]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <UniversitySidebar />
      <main className="flex-1 p-6 lg:p-12">
        <h1 className="text-2xl font-bold mb-6">Enrolled Students</h1>
        {loading ? (
          <div className="p-6">Loading students…</div>
        ) : error ? (
          <div className="p-6 text-red-600">{error}</div>
        ) : students.length === 0 ? (
          <div>No students enrolled yet.</div>
        ) : (
          <table className="w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Name</th>
                <th className="border p-2 text-left">Email</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s._id || s.studentId._id}>
                  <td className="border p-2">{s.studentId.name}</td>
                  <td className="border p-2">{s.studentId.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}
