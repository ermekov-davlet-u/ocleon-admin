import { useEffect, useRef, useState } from 'react';
import { message } from 'antd';
import { useLazyGetOrdersQuery } from '../store/api/orderApi';

const PAGE_SIZE = 100;
const MAX_PAGES = 1000; // аварийный потолок: 1000 * 100 = 100 000 записей, дальше точно что-то не так

/**
 * Догружает заказы страницами по 100 записей, пока не заберёт весь список,
 * и накапливает их в единый массив.
 *
 * Защита от бесконечной загрузки:
 *  - понимает и новый формат ответа { data, total, hasMore }, и старый
 *    (сервер просто вернул массив целиком, без пагинации) — тогда считаем,
 *    что это единственная и последняя "страница";
 *  - останавливается, если очередная страница пришла пустой;
 *  - останавливается, если уже набрали >= total записей, даже если сервер
 *    почему-то продолжает слать hasMore: true;
 *  - жёсткий потолок MAX_PAGES на случай, если бэкенд некорректно считает total.
 */
export function useAllOrders() {
  const [triggerGetOrders] = useLazyGetOrdersQuery();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const requestIdRef = useRef(0);

  const loadAll = async () => {
    const requestId = ++requestIdRef.current;

    setIsLoading(true);
    setIsLoadingMore(false);
    setOrders([]);

    let page = 1;
    
    let accumulated = [];

    try {
      while (page <= MAX_PAGES) {
        const raw = await triggerGetOrders({ page, limit: PAGE_SIZE }).unwrap();

        // Если запустился более новый reload() — бросаем эту загрузку,
        // чтобы не перезаписать уже свежие данные устаревшими.
        if (requestId !== requestIdRef.current) return;

        // Поддержка старого формата ответа (сервер просто вернул массив,
        // без пагинации) на случай, если бэкенд ещё не обновлён.
        const isPaginated = raw && !Array.isArray(raw) && Array.isArray(raw.data);
        const pageData = isPaginated ? raw.data : Array.isArray(raw) ? raw : [];
        const total = isPaginated ? raw.total : pageData.length;
        const serverSaysHasMore = isPaginated ? Boolean(raw.hasMore) : false;
console.log({
  page,
  received: pageData.length,
  total,
  hasMore: serverSaysHasMore,
});
        accumulated = [...accumulated, ...pageData];
        setOrders(accumulated);

        if (page === 1) setIsLoading(false);

        const noMoreData = pageData.length === 0;
        const reachedTotal = typeof total === 'number' && accumulated.length >= total;

        if (!serverSaysHasMore || noMoreData || reachedTotal) {
          break;
        }

        if (page === MAX_PAGES) {
          console.warn('[useAllOrders] Достигнут предел в', MAX_PAGES, 'страниц — останавливаю загрузку');
          message.warning('Загружена только часть заказов — список слишком большой');
          break;
        }

        setIsLoadingMore(true);
        page += 1;
      }
    } catch (err) {
      console.error('[useAllOrders] Ошибка при загрузке заказов:', err);
      message.error('Не удалось загрузить список заказов');
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { orders, isLoading, isLoadingMore, reload: loadAll };
}