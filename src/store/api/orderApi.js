import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';

export const orderApi = createApi({
  reducerPath: 'orderApi',
  baseQuery: baseQueryWithReauth, // с авторизацией и 401-редиректом
  tagTypes: ['CuttingOrder'],
  endpoints: (builder) => ({
    // Теперь принимает { page, limit } и возвращает { data, total, page, limit, hasMore }.
    // По умолчанию грузим по 100 записей за раз.
    getOrders: builder.query({
      query: ({ page = 1, limit = 100 } = {}) =>
        `cutting-orders?page=${page}&limit=${limit}`,
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
    createSimpleOrder: builder.mutation({
      query: (body) => ({
        url: 'cutting-orders/simple',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CuttingOrder'],
    }),
    getClientHistory: builder.query({
      query: (phone) => `/cutting-orders/client-history?phone=${encodeURIComponent(phone)}`,
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
      query: ({ id, status, comment }) => ({
        url: `cutting-orders/status-change/${id}`,
        method: 'PATCH',
        body: { status, comment }, // передаем объект { status: "новый статус", comment: "комментарий" }
      }),
      invalidatesTags: ['CuttingOrder'],
    }),
    useWarranty: builder.mutation({
      query: (id) => ({
        url: `/cutting-orders/${id}/use-warranty`,
        method: "POST",
      }),
      invalidatesTags: ["CuttingOrders"],
    }),
    useDefectRework: builder.mutation({
      query: (id) => ({
        url: `/cutting-orders/${id}/use-defect-rework`,
        method: "POST",
      }),
      invalidatesTags: ["CuttingOrders"],
    }),
  }),

});

export const {
  useGetOrdersQuery,
  useLazyGetOrdersQuery,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useGetClientHistoryQuery,
  useDeleteOrderMutation,
  useUseWarrantyMutation,
  useChangeOrderStatusMutation,
  useUseDefectReworkMutation,
  useCreateSimpleOrderMutation
} = orderApi;