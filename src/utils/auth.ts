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

            // Set cookies (handled automatically by browser if server sets them)
            // The server should set these cookies in the response
            return { token, expiresIn, refreshToken };
        }
    } catch (error) {
        console.error("Login failed", error);
        throw error;
    }
};

export const generateRefreshToken = async (refreshToken: string) => {
    try {
        const response = await axios.post(`${process.env.FETCH_URL}/auth/refresh`, {
            refreshToken: refreshToken
        });

        if (response.status === 200) {
            const { token, expiresIn } = response.data;
            return { token, expiresIn };
        }
    } catch (error) {
        console.error("Token refresh failed", error);
        // You might want to redirect to login page here
        throw error;
    }
};