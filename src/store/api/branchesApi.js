import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const branchesApi = createApi({
  reducerPath: 'branchesApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:5000' }),
  tagTypes: ['Branch'],
  endpoints: (builder) => ({
    getBranches: builder.query({
      query: () => '/branches',
      providesTags: ['Branch'],
    }),
    createBranch: builder.mutation({
      query: (data) => ({
        url: '/branches',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Branch'],
    }),
    updateBranch: builder.mutation({
      query: ({ id, data }) => ({
        url: `/branches/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Branch'],
    }),
    deleteBranch: builder.mutation({
      query: (id) => ({
        url: `/branches/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Branch'],
    }),
  }),
});

export const {
  useGetBranchesQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useDeleteBranchMutation,
} = branchesApi;
