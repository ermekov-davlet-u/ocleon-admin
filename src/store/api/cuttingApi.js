import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// базовый URL
const BASE_URL = 'https://ocleon-back.onrender.com';

export const cuttingApi = createApi({
  reducerPath: 'cuttingApi',
  baseQuery: fetchBaseQuery({ baseUrl: BASE_URL }),
  tagTypes: ['CuttingJob', 'Material', 'DeviceType', 'CuttingType', 'User'],
  endpoints: (builder) => ({
    // ---------- Cutting Jobs ----------
    getCuttingJobs: builder.query({
      query: () => '/cutting-jobs',
      providesTags: ['CuttingJob'],
    }),
    getCuttingJob: builder.query({
      query: (id) => `/cutting-jobs/${id}`,
      providesTags: ['CuttingJob'],
    }),
    createCuttingJob: builder.mutation({
      query: (formData) => ({
        url: '/cutting-jobs',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['CuttingJob'],
    }),
    updateCuttingJob: builder.mutation({
      query: ({ id, data }) => ({
        url: `/cutting-jobs/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['CuttingJob'],
    }),
    deleteCuttingJob: builder.mutation({
      query: (id) => ({
        url: `/cutting-jobs/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['CuttingJob'],
    }),

    // ---------- Materials ----------
    getMaterials: builder.query({
      query: () => '/materials',
      providesTags: ['Material'],
    }),
    createMaterial: builder.mutation({
      query: (data) => ({
        url: '/materials',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Material'],
    }),

    // ---------- Device Types ----------
    getDeviceTypes: builder.query({
      query: () => '/device-types',
      providesTags: ['DeviceType'],
    }),
    createDeviceType: builder.mutation({
      query: (data) => ({
        url: '/device-types',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['DeviceType'],
    }),

    // ---------- Cutting Types ----------
    getCuttingTypes: builder.query({
      query: () => '/cutting-types',
      providesTags: ['CuttingType'],
    }),
    createCuttingType: builder.mutation({
      query: (data) => ({
        url: '/cutting-types',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['CuttingType'],
    }),

    // ---------- Users ----------
    getUsers: builder.query({
      query: () => '/users',
      providesTags: ['User'],
    }),
  }),
});

export const {
  useGetCuttingJobsQuery,
  useGetCuttingJobQuery,
  useCreateCuttingJobMutation,
  useUpdateCuttingJobMutation,
  useDeleteCuttingJobMutation,
  useGetMaterialsQuery,
  useCreateMaterialMutation,
  useGetDeviceTypesQuery,
  useCreateDeviceTypeMutation,
  useGetCuttingTypesQuery,
  useCreateCuttingTypeMutation,
  useGetUsersQuery,
} = cuttingApi;
