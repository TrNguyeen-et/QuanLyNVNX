import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:8080/api', // Địa chỉ Backend Spring Boot
    headers: {
        'Content-Type': 'application/json'
    }
});

export default API;
// Lấy lương nhân viên theo tháng
export const getSalary = (userId, year, month) => {
  return API.get(`/staff/${userId}/salary?year=${year}&month=${month}`);
};