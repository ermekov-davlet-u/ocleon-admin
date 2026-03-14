import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";

export const cuttingJobApi = createApi({
  reducerPath: "cuttingJobApi",
  baseQuery: baseQueryWithReauth,
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
    previewCuttingJob: builder.query({
      query: (data) => ({
        url: "/cutting-jobs/for-cutting",
        method: "GET",
        params: data,
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
  usePreviewCuttingJobQuery,
  useCreateCuttingJobMutation,
  useUpdateCuttingJobMutation,
  useDeleteCuttingJobMutation,
} = cuttingJobApi;
