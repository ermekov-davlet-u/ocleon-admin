// store/materialsApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { mainURL } from '../../config';

export const materialsApi = createApi({
  reducerPath: 'materialsApi',
  baseQuery: fetchBaseQuery({ baseUrl: mainURL }),
  tagTypes: ['Materials'],
  endpoints: (builder) => ({
    getMaterials: builder.query({
      query: () => 'materials',
      providesTags: ['Materials'],
    }),
    getDiscounts: builder.query({
      query: () => 'discount',
      providesTags: ['discount'],
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
  useGetDiscountsQuery,
  useCreateMaterialMutation,
  useUpdateMaterialMutation,
  useDeleteMaterialMutation,
} = materialsApi;
