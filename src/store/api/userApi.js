import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { mainURL } from '../../config';

export const usersApi = createApi({
    reducerPath: 'usersApi',
    baseQuery: fetchBaseQuery({ baseUrl: mainURL }),
    tagTypes: ['Users'],
    endpoints: (builder) => ({
        getUsers: builder.query({
            query: () => 'users',
            providesTags: ['Users'],
        }),
        getBranches: builder.query({
            query: () => 'branches',
        }),
        createUser: builder.mutation({
            query: (body) => ({
                url: 'users',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Users'],
        }),
        updateUser: builder.mutation({
            query: ({ id, body }) => ({
                url: `users/${id}`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: ['Users'],
        }),
        deleteUser: builder.mutation({
            query: (id) => ({
                url: `users/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Users'],
        }),
    }),
});

export const {
    useGetUsersQuery,
    useGetBranchesQuery,
    useCreateUserMutation,
    useUpdateUserMutation,
    useDeleteUserMutation,
} = usersApi;
