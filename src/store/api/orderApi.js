import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const orderApi = createApi({
  reducerPath: 'orderApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:5000/' }), // замени на свой URL
  tagTypes: ['CuttingOrder'],
  endpoints: (builder) => ({
    getOrders: builder.query({
      query: () => 'cutting-orders',
      providesTags: ['CuttingOrder'],
    }),
    createOrder: builder.mutation({
      query: (body) => ({
        url: 'cutting-orders',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CuttingOrder'],
    }),
    updateOrder: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `cutting-orders/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['CuttingOrder'],
    }),
    deleteOrder: builder.mutation({
      query: (id) => ({
        url: `cutting-orders/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['CuttingOrder'],
    }),
    changeOrderStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `cutting-orders/status-change/${id}`,
        method: 'PATCH',
        body: { status }, // передаем объект { status: "новый статус" }
      }),
      invalidatesTags: ['CuttingOrder'],
    }),
  }),

});

export const {
  useGetOrdersQuery,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useDeleteOrderMutation,
  useChangeOrderStatusMutation
} = orderApi;
