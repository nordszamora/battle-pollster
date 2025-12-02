import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";

const apiClient = axios.create({
    headers: {
      "Content-Type": "application/json",
    },
});

// API REQUEST TO RETRIEVE A VOTING POLL
export function VOTING_POLL(poll) {
    const voting_poll = useQuery({
        queryKey: ['poll', poll],
        queryFn: async () => {
            const response = await apiClient.get(`/poll/${poll}`, { withCredentials: true });
            return response.data.message;
        },
        retry: false,         
        refetchOnWindowFocus: false
    });

    return voting_poll;
}

// API REQUEST FOR VOTING VOTE A
export function VOTING_A(csrf) {
    const voting_a = useMutation({
        mutationFn: async ({poll_id, voting_id}) => {
            const response = await apiClient.post(`/vote/vote_a/${poll_id}/${voting_id}`, {}, {
                headers: {
                  'X-CSRF-TOKEN': csrf
                },
                withCredentials: true
            });
            return response.data;
        }
    });

    return voting_a;
}

// API REQUEST FOR VOTING VOTE B
export function VOTING_B(csrf) {
    const voting_b = useMutation({
        mutationFn: async ({poll_id, voting_id}) => {
            const response = await apiClient.post(`/vote/vote_b/${poll_id}/${voting_id}`, {}, {
                headers: {
                  'X-CSRF-TOKEN': csrf
                },
                withCredentials: true
            });
            return response.data;
        }
    });

    return voting_b;
}

// API REQUEST FOR POLL EXPIRATION
export function POLL_EXPIRATION(csrf) {
    const poll_expiration = useMutation({
        mutationFn: async ({poll_id, poll_expired}) => {
            const response = await apiClient.put(`/poll/${poll_id}`, { poll_expired }, {
                headers: {
                  'X-CSRF-TOKEN': csrf
                },
                withCredentials: true
            });
            return response.data;
        }
    });

    return poll_expiration;
}