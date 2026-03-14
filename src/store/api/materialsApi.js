import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';

export const materialsApi = createApi({
  reducerPath: 'materialsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Materials'],
  endpoints: (builder) => ({

    getMaterials: builder.query({
      query: () => 'materials',
      providesTags: ['Materials'],
    }),

    getMaterial: builder.query({
      query: (id) => `materials/${id}`,
      providesTags: (result, error, id) => [{ type: 'Materials', id }],
    }),

    // ✅ FormData — поддерживает файлы
    createMaterial: builder.mutation({
      query: (formData) => ({
        url: 'materials',
        method: 'POST',
        body: formData, // FormData
      }),
      invalidatesTags: ['Materials'],
    }),

    // ✅ FormData — поддерживает файлы
    updateMaterial: builder.mutation({
      query: ({ id, formData }) => ({
        url: `materials/${id}`,
        method: 'PATCH',
        body: formData, // FormData
      }),
      invalidatesTags: ['Materials'],
    }),

    // ✅ Удалить один файл материала
    deleteMaterialFile: builder.mutation({
      query: ({ materialId, fileId }) => ({
        url: `materials/${materialId}/files/${fileId}`,
        method: 'DELETE',
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
  useGetMaterialQuery,
  useCreateMaterialMutation,
  useUpdateMaterialMutation,
  useDeleteMaterialFileMutation,
  useDeleteMaterialMutation,
} = materialsApi;
