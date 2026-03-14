// store/api/discountApi.js
import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';

export const discountApi = createApi({
  reducerPath: 'discountApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Discount'],
  endpoints: (builder) => ({
    getDiscounts: builder.query({
      query: () => '/discount',
      providesTags: (result) =>
        result
          ? [
              ...result.map((d) => ({ type: 'Discount', id: d.id })),
              { type: 'Discount', id: 'LIST' },
            ]
          : [{ type: 'Discount', id: 'LIST' }],
    }),
    getDiscount: builder.query({
      query: (id) => `/discount/${id}`,
      providesTags: (_res, _err, id) => [{ type: 'Discount', id }],
    }),
    createDiscount: builder.mutation({
      query: (body) => ({
        url: '/discount',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Discount', id: 'LIST' }],
    }),
    updateDiscount: builder.mutation({
      query: ({ id, body }) => ({
        url: `/discount/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_res, _err, { id }) => [{ type: 'Discount', id }],
    }),
    deleteDiscount: builder.mutation({
      query: (id) => ({
        url: `/discount/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Discount', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetDiscountsQuery,
  useGetDiscountQuery,
  useCreateDiscountMutation,
  useUpdateDiscountMutation,
  useDeleteDiscountMutation,
} = discountApi;
