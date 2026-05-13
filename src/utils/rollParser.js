const departmentCodes = {
  'AD': 'AIDS', 'AL': 'AIML', 'CS': 'CSE', 'AU': 'AUTO', 'CH': 'CHEM',
  'FT': 'FOOD', 'CE': 'CIVIL', 'CD': 'CSD', 'IT': 'IT', 'EE': 'EEE',
  'EI': 'EIE', 'EC': 'ECE', 'ME': 'MECH', 'MT': 'MTS', 'IS': 'MSC',
  'MC': 'MCA', 'MB': 'MBA', 'BI': 'BSC', 'AR': 'ARCH'
};

export const getYearFromRollNo = (rollNo) => {
  if (!rollNo || rollNo.length < 2) return '';
  const y = parseInt(rollNo.substring(0, 2));
  if (y === 22) return '5th Year';
  if (y === 23) return '4th Year';
  if (y === 24) return '3rd Year';
  if (y === 25) return '2nd Year';
  if (y === 26) return '1st Year';
  return '1st Year';
};

export const getDepartmentFromRollNo = (rollNo) => {
  if (!rollNo || rollNo.length < 4) return '';
  return departmentCodes[rollNo.substring(2, 4).toUpperCase()] || '';
};
