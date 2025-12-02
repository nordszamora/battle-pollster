import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";

const apiClient = axios.create({
    headers: {
      "Content-Type": "application/json",
    },
});

// API REQUEST TO RETRIEVE A USER AUTHENTICATION
export function IS_AUTH() {
    const isauth = useQuery({
        queryKey: ['isauth'],
        queryFn: async () => {
            const response = await apiClient.get('/isauth', { withCredentials: true });
            return response.data;
        },
        retry: false,         
        refetchOnWindowFocus: false
    });

    return isauth;
}

// API REQUEST TO RETRIEVE A POLL LIST
export function POLL_LIST() {
    const poll_list = useQuery({
        queryKey: ['poll_list'],
        queryFn: async () => {
            const response = await apiClient.get('/poll_list', { withCredentials: true });
            return response.data.polls;
        },
        retry: false,         
        refetchOnWindowFocus: false
    });

    return poll_list;
}

// API REQUEST FOR POLL UPLOAD
export function POLL_UPLOAD(csrf) {
    const poll_upload = useMutation({
        mutationFn: async (form) => {
            const response = await apiClient.post('/poll_list', form, {
                headers: {
                  'X-CSRF-TOKEN': csrf
                },
                withCredentials: true
            });
            return response.data;
        }
    });

    return poll_upload;
}

// API REQUEST FOR POLL DELETION
export function DELETE_POLL(csrf) {
    const delete_poll = useMutation({
        mutationFn: async ({poll_id}) => {
            const response = await apiClient.delete(`/poll/${poll_id}`, {
                headers: {
                  'X-CSRF-TOKEN': csrf
                },
                withCredentials: true
            });
            return response.data;
        }
    });

    return delete_poll;
}

// API REQUEST FOR LOGOUT
export function LOGOUT(csrf) {
    const logout = useMutation({
        mutationFn: async () => {
            const response = await apiClient.post('/logout', {
                headers: {
                  'X-CSRF-TOKEN': csrf
                },
                withCredentials: true
            });
            return response.data;
        }
    });

    return logout;
}