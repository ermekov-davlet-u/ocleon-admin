// store/materialsApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const materialsApi = createApi({
  reducerPath: 'materialsApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://ocleon-back.onrender.com/' }),
  tagTypes: ['Materials'],
  endpoints: (builder) => ({
    getMaterials: builder.query({
      query: () => 'materials',
      providesTags: ['Materials'],
    }),
    createMaterial: builder.mutation({
      query: (body) => ({
        url: 'materials',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Materials'],
    }),
    updateMaterial: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `materials/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Materials'],
    }),
    deleteMaterial: builder.mutation({
      query: (id) => ({
        url: `materials/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Materials'],
    }),
  }),
});

export const {
  useGetMaterialsQuery,
  useCreateMaterialMutation,
  useUpdateMaterialMutation,
  useDeleteMaterialMutation,
} = materialsApi;
