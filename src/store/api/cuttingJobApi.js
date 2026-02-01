import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const cuttingJobApi = createApi({
  reducerPath: "cuttingJobApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:5000", // поменяй на свой бэкенд
  }),
  tagTypes: ["CuttingJob"],
  endpoints: (builder) => ({
    getCuttingJobs: builder.query({
      query: () => "/cutting-jobs",
      providesTags: ["CuttingJob"],
    }),
    getCuttingJob: builder.query({
      query: (id) => `/cutting-jobs/${id}`,
      providesTags: ["CuttingJob"],
    }),
    createCuttingJob: builder.mutation({
      query: (formData) => ({
        url: "/cutting-jobs",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["CuttingJob"],
    }),
     previewCuttingJob: builder.mutation({
      query: (data) => ({
        url: "/cutting-jobs/for-cutting",
        method: "POST",
        body: data,
      }),
    }),
    updateCuttingJob: builder.mutation({
      query: ({ id, data }) => ({
        url: `/cutting-jobs/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["CuttingJob"],
    }),
    deleteCuttingJob: builder.mutation({
      query: (id) => ({
        url: `/cutting-jobs/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["CuttingJob"],
    }),
  }),
});

export const {
  useGetCuttingJobsQuery,
  useGetCuttingJobQuery,
  usePreviewCuttingJobMutation,
  useCreateCuttingJobMutation,
  useUpdateCuttingJobMutation,
  useDeleteCuttingJobMutation,
} = cuttingJobApi;
