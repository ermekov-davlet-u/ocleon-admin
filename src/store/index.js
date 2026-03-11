import { configureStore } from '@reduxjs/toolkit';
import { cuttingApi } from './api/cuttingApi';
import { deviceTypeApi } from './api/deviceTypeApi';
import { materialsApi } from './api/materialsApi';
import { clientsApi } from './api/clientsApi';
import { branchesApi } from './api/branchesApi';
import { armorTypesApi } from './api/armorTypesApi';
import { cuttingJobApi } from './api/cuttingJobApi';
import { orderApi } from './api/orderApi';
import { invoiceApi } from './api/invoiceApi';
import { usersApi } from './api/userApi';
import { authApi } from './api/authApi';
import { discountApi } from './api/discountApi';
import { bookingsApi } from './api/bookingsApi';

export const store = configureStore({
  reducer: {
    [cuttingApi.reducerPath]: cuttingApi.reducer,
    [deviceTypeApi.reducerPath]: deviceTypeApi.reducer,
    [materialsApi.reducerPath]: materialsApi.reducer,
    [clientsApi.reducerPath]: clientsApi.reducer,
    [branchesApi.reducerPath]: branchesApi.reducer,
    [armorTypesApi.reducerPath]: armorTypesApi.reducer,
    [cuttingJobApi.reducerPath]: cuttingJobApi.reducer,
    [orderApi.reducerPath]: orderApi.reducer,
    [invoiceApi.reducerPath]: invoiceApi.reducer,
    [discountApi.reducerPath]: discountApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [authApi.reducerPath]: authApi.reducer,
    [bookingsApi.reducerPath]: bookingsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      cuttingApi.middleware,
      deviceTypeApi.middleware,
      materialsApi.middleware,
      clientsApi.middleware,
      branchesApi.middleware,
      cuttingJobApi.middleware,
      armorTypesApi.middleware,
      orderApi.middleware,
      invoiceApi.middleware,
      usersApi.middleware,
      bookingsApi.middleware,
      discountApi.middleware
    ),
});

// Типы для useSelector и useDispatch
