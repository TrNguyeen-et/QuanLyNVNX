import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:8080/api', // Địa chỉ Backend Spring Boot
    headers: {
        'Content-Type': 'application/json'
    }
});

export default API;