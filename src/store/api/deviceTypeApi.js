import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const deviceTypeApi = createApi({
  reducerPath: 'deviceTypeApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://ocleon-back.onrender.com' }),
  tagTypes: ['DeviceType'],
  endpoints: (builder) => ({
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
    updateDeviceType: builder.mutation({
      query: ({ id, data }) => ({
        url: `/device-types/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['DeviceType'],
    }),
    deleteDeviceType: builder.mutation({
      query: (id) => ({
        url: `/device-types/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['DeviceType'],
    }),
  }),
});

export const {
  useGetDeviceTypesQuery,
  useCreateDeviceTypeMutation,
  useUpdateDeviceTypeMutation,
  useDeleteDeviceTypeMutation,
} = deviceTypeApi;
