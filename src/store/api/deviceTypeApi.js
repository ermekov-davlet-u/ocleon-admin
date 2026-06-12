import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';

export const deviceTypeApi = createApi({
  reducerPath: 'deviceTypeApi',
  baseQuery: baseQueryWithReauth,
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
    mergeDeviceTypes: builder.mutation({
      query: (body) => ({
        url: 'device-types/merge',
        method: 'POST',
        body,
      }),
    }),
    uploadDeviceTypeImage: builder.mutation({
      query: ({ id, file }) => ({
        url: `device-types/${id}/image`,
        method: 'POST',
        body: file,
      }),
      invalidatesTags: ['DeviceType'],
    }),
    removeDeviceTypeImage: builder.mutation({
      query: (id) => ({
        url: `device-types/${id}/image`,
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
  useMergeDeviceTypesMutation,
  useUploadDeviceTypeImageMutation,
  useRemoveDeviceTypeImageMutation
} = deviceTypeApi;
