import * as XLSX from "xlsx";

export function exportAttendanceToExcel(attendance, eventName, date) {
  const rows = attendance.map((a, i) => ({
    "S.No": i + 1,
    "Record ID": a.recordId || "",
    "Event ID": a.eventId || "",
    "Roll No": a.rollNumber || a.rollNo || "",
    "Name": a.studentName || a.name || "",
    "Department": a.department || "",
    "Year": a.year || "",
    "Status": a.status || "",
    "Attempt Type": a.attemptType || "",
    "Distance (m)": typeof a.distanceFromEvent === 'number' ? a.distanceFromEvent : "",
    "GPS Accuracy (m)": typeof a.gpsAccuracy === 'number' ? a.gpsAccuracy : "",
    "Timestamp": a.timestamp?.seconds
      ? new Date(a.timestamp.seconds * 1000).toLocaleString("en-IN")
      : a.scannedAt?.seconds
      ? new Date(a.scannedAt.seconds * 1000).toLocaleString("en-IN")
      : "N/A"
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  // Set column widths
  ws["!cols"] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 12 },
    { wch: 16 },
    { wch: 22 },
    { wch: 18 },
    { wch: 10 },
    { wch: 12 },
    { wch: 16 },
    { wch: 14 },
    { wch: 16 },
    { wch: 24 }
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Attendance");
  XLSX.writeFile(wb, `${eventName}_${date}_Attendance.xlsx`);
}
