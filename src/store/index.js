import { configureStore } from '@reduxjs/toolkit';
import { cuttingApi } from './api/cuttingApi';
import { deviceTypeApi } from './api/deviceTypeApi';
import { materialsApi } from './api/materialsApi';
import { clientsApi } from './api/clientsApi';
import { branchesApi } from './api/branchesApi';
import { armorTypesApi } from './api/armorTypesApi';
import { cuttingJobApi } from './api/cuttingJobApi';
import { orderApi } from './api/orderApi';

export const store = configureStore({
  reducer: {
    [cuttingApi.reducerPath]: cuttingApi.reducer,
    [deviceTypeApi.reducerPath]: deviceTypeApi.reducer,
    [materialsApi.reducerPath]: materialsApi.reducer,
    [clientsApi.reducerPath]: clientsApi.reducer,
    [branchesApi.reducerPath]: branchesApi.reducer,
    [armorTypesApi.reducerPath]: armorTypesApi.reducer,
    [cuttingJobApi.reducerPath]: cuttingJobApi.reducer,
    [orderApi.reducerPath]: orderApi.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(cuttingApi.middleware, deviceTypeApi.middleware, materialsApi.middleware, clientsApi.middleware,
        branchesApi.middleware,
        cuttingJobApi.middleware,
        armorTypesApi.middleware,
        orderApi.middleware
    ),
});

// Типы для useSelector и useDispatch
