import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const clientsApi = createApi({
  reducerPath: 'clientsApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://ocleon-back.onrender.com' }),
  tagTypes: ['Client'],
  endpoints: (builder) => ({
    getClients: builder.query({
      query: () => '/clients',
      providesTags: ['Client'],
    }),
    createClient: builder.mutation({
      query: (data) => ({
        url: '/clients',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Client'],
    }),
    updateClient: builder.mutation({
      query: ({ id, data }) => ({
        url: `/clients/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Client'],
    }),
    deleteClient: builder.mutation({
      query: (id) => ({
        url: `/clients/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Client'],
    }),
  }),
});

export const {
  useGetClientsQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
} = clientsApi;
