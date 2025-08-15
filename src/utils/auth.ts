import axios from "axios";

export const generateToken = async () => {
    try {
        const response = await axios.post(`${process.env.FETCH_URL}/auth/login`, {
            username: "testuser",
            password: "testpass"
        }, {
            withCredentials: true // Important for cookies
        });

        if (response.status === 200) {
            const { token, expiresIn, refreshToken } = response.data;
            console.log("Login successful", response.data);

            // Set cookies (handled automatically by browser if server sets them)
            // The server should set these cookies in the response
            return { token, expiresIn, refreshToken };
        }
    } catch (error) {
        console.error("Login failed", error);
        throw error;
    }
};

export const generateRefreshToken = async () => {
    try {
        const response = await axios.post(`${process.env.FETCH_URL}/auth/refresh`, {}, {
            withCredentials: true // Send cookies automatically
        });

        if (response.status === 200) {
            const { token } = response.data;
            return token;
        }
    } catch (error) {
        console.error("Token refresh failed", error);
        // You might want to redirect to login page here
        throw error;
    }
};