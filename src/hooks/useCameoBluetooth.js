import { useCallback, useRef, useState } from "react";
import { GPGL } from "../utils/gpgl";
import { pltToGpgl } from "../utils/pltToGpgl";

export function useCameoBluetooth() {
    const [device, setDevice] =
        useState(null);

    const [characteristics, setCharacteristics] =
        useState([]);

    const [selectedCharacteristic, setSelectedCharacteristic] =
        useState(null);

    const [connected, setConnected] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [sending, setSending] = useState(false);

    const [logs, setLogs] = useState([]);
    const [status, setStatus] = useState("Готов");

    const characteristicRef =
        useRef(null);

    const log = useCallback((message) => {
        console.log(message);

        setLogs((prev) => [
            `${new Date().toLocaleTimeString()}  ${message}`,
            ...prev,
        ]);
    }, []);

    const hex = useCallback((data) => {
        return Array.from(data)
            .map((e) =>
                e.toString(16).padStart(2, "0").toUpperCase()
            )
            .join(" ");
    }, []);

    /**
     * ==========================================
     * CONNECT
     * ==========================================
     */

    const connect = useCallback(async () => {
        if (!navigator.bluetooth) {
            throw new Error(
                "Web Bluetooth не поддерживается этим браузером"
            );
        }

        if (connecting) return;

        try {
            setConnecting(true);
            setStatus("Выбор Cameo...");

            log("Открываем выбор Bluetooth устройства");

            const selectedDevice =
                await navigator.bluetooth.requestDevice({
                    acceptAllDevices: true,

                    optionalServices: [
                        // Пока неизвестны конкретные UUID Cameo.
                        // Сервисы получаем через getPrimaryServices().
                    ],
                });

            log(
                `Выбрано устройство: ${selectedDevice.name || "Без имени"
                }`
            );

            log(`ID: ${selectedDevice.id}`);

            selectedDevice.addEventListener(
                "gattserverdisconnected",
                () => {
                    log("Cameo отключён");

                    setConnected(false);
                    setDevice(null);
                    setSelectedCharacteristic(null);
                    characteristicRef.current = null;

                    setStatus("Отключено");
                }
            );

            if (!selectedDevice.gatt) {
                throw new Error("GATT недоступен");
            }

            setStatus("Подключение...");

            const server =
                await selectedDevice.gatt.connect();

            log("GATT подключение успешно");

            setDevice(selectedDevice);
            setConnected(true);

            setStatus("Поиск сервисов...");

            const services =
                await server.getPrimaryServices();

            log(`Найдено сервисов: ${services.length}`);

            const writable = [];

            for (const service of services) {
                log(`SERVICE: ${service.uuid}`);

                const chars =
                    await service.getCharacteristics();

                for (const characteristic of chars) {
                    const properties =
                        characteristic.properties;

                    log(
                        `  CHAR: ${characteristic.uuid} ` +
                        `read=${properties.read} ` +
                        `write=${properties.write} ` +
                        `writeNR=${properties.writeWithoutResponse} ` +
                        `notify=${properties.notify}`
                    );

                    if (
                        properties.write ||
                        properties.writeWithoutResponse
                    ) {
                        writable.push({
                            characteristic,
                            serviceUuid: service.uuid,
                            uuid: characteristic.uuid,
                            properties: {
                                read: properties.read,
                                write: properties.write,
                                writeWithoutResponse:
                                    properties.writeWithoutResponse,
                                notify: properties.notify,
                            },
                        });
                    }
                }
            }

            if (!writable.length) {
                throw new Error(
                    "Writable characteristic не найдена"
                );
            }

            log(
                `Writable characteristics: ${writable.length}`
            );

            /**
             * Здесь получаем те самые 5 характеристик,
             * которые сейчас показывает Flutter.
             */
            setCharacteristics(writable);

            setStatus(
                `Найдено характеристик: ${writable.length}`
            );

            return writable;
        } catch (error) {
            console.error(error);

            log(`Ошибка подключения: ${error}`);

            setStatus("Ошибка подключения");

            setConnected(false);

            throw error;
        } finally {
            setConnecting(false);
        }
    }, [connecting, log]);

    /**
     * ==========================================
     * SELECT CHARACTERISTIC
     * ==========================================
     */

    const selectCharacteristic = useCallback(
        async (item) => {
            const characteristic =
                item.characteristic;

            characteristicRef.current =
                characteristic;

            setSelectedCharacteristic(characteristic);

            log(
                `Выбрана characteristic: ${characteristic.uuid}`
            );

            log(
                `write=${characteristic.properties.write} ` +
                `writeWithoutResponse=${characteristic.properties.writeWithoutResponse}`
            );

            /**
             * Notify
             */
            if (characteristic.properties.notify) {
                try {
                    await characteristic.startNotifications();

                    characteristic.addEventListener(
                        "characteristicvaluechanged",
                        (event) => {
                            const target =
                                event.target;

                            const value =
                                target.value;

                            if (!value) return;

                            const bytes = Array.from(
                                new Uint8Array(
                                    value.buffer,
                                    value.byteOffset,
                                    value.byteLength
                                )
                            );

                            log(`RX: ${hex(bytes)}`);

                            try {
                                const text = new TextDecoder().decode(
                                    new Uint8Array(bytes)
                                );

                                if (text.trim()) {
                                    log(`RX TEXT: ${text}`);
                                }
                            } catch { }
                        }
                    );

                    log("Notifications включены");
                } catch (error) {
                    log(
                        `Не удалось включить notify: ${error}`
                    );
                }
            }

            setStatus("Подключено");
        },
        [hex, log]
    );

    /**
     * ==========================================
     * SEND BYTES
     * ==========================================
     */

    const sendBytes = useCallback(
        async (bytes) => {
            const characteristic =
                characteristicRef.current;

            if (!characteristic) {
                throw new Error(
                    "BLE characteristic не выбрана"
                );
            }

            if (!bytes.length) return;

            const withoutResponse =
                characteristic.properties
                    .writeWithoutResponse &&
                !characteristic.properties.write;

            /**
             * Как и во Flutter:
             * 20 байт на пакет.
             */
            const chunkSize = 20;

            log(
                `TX ${bytes.length} bytes: ${hex(bytes)}`
            );

            for (
                let offset = 0;
                offset < bytes.length;
                offset += chunkSize
            ) {
                const end = Math.min(
                    offset + chunkSize,
                    bytes.length
                );

                const chunk =
                    bytes.slice(offset, end);

                log(`TX chunk: ${hex(chunk)}`);

                const data = new Uint8Array(chunk);

                if (
                    withoutResponse &&
                    characteristic.writeValueWithoutResponse
                ) {
                    await characteristic.writeValueWithoutResponse(
                        data
                    );
                } else {
                    await characteristic.writeValue(data);
                }

                await new Promise((resolve) =>
                    setTimeout(resolve, 20)
                );
            }
        },
        [hex, log]
    );

    /**
     * ==========================================
     * SEND GPGL
     * ==========================================
     */

    const sendGpgl = useCallback(
        async (command) => {
            await sendBytes(command);

            await new Promise((resolve) =>
                setTimeout(resolve, 150)
            );
        },
        [sendBytes]
    );

    /**
     * ==========================================
     * FG
     * ==========================================
     */

    const queryFirmware = useCallback(async () => {
        if (!characteristicRef.current) {
            log("Сначала выберите characteristic");

            return;
        }

        try {
            setStatus("Запрос FG...");

            log("Отправляем GPGL FG");

            await sendGpgl(GPGL.queryVersion());

            setStatus("FG отправлен");
        } catch (error) {
            log(`Ошибка FG: ${error}`);

            setStatus("Ошибка FG");
        }
    }, [log, sendGpgl]);

    /**
     * ==========================================
     * STATUS
     * ==========================================
     */

    const requestStatus = useCallback(async () => {
        if (!characteristicRef.current) {
            log("Сначала выберите characteristic");

            return;
        }

        try {
            setStatus("Запрос статуса...");

            await sendGpgl(GPGL.statusRequest());

            setStatus("Статус отправлен");
        } catch (error) {
            log(`Ошибка status: ${error}`);
        }
    }, [log, sendGpgl]);

    /**
     * ==========================================
     * TEST CUT
     * ==========================================
     */

    const sendTestCut = useCallback(async () => {
        if (!characteristicRef.current) {
            log("Сначала выберите characteristic");

            return;
        }

        if (sending) return;

        try {
            setSending(true);

            setStatus("Отправка реза...");

            log("==============================");
            log("НАЧАЛО ТЕСТОВОГО РЕЗА");

            const job =
                GPGL.testCutLineJob({
                    lengthMm: 10,
                    speed: 3,
                    force: 5,
                    tool: 1,
                });

            log(`Команд в job: ${job.length}`);

            for (let i = 0; i < job.length; i++) {
                const command = job[i];

                log(
                    `GPGL command ${i + 1}/${job.length}: ` +
                    hex(command)
                );

                await sendGpgl(command);
            }

            setStatus("Тестовый рез отправлен");

            log("ТЕСТОВЫЙ РЕЗ ЗАВЕРШЁН");
        } catch (error) {
            log(`Ошибка тестового реза: ${error}`);

            setStatus("Ошибка реза");
        } finally {
            setSending(false);
        }
    }, [hex, log, sending, sendGpgl]);

    /**
     * ==========================================
     * DISCONNECT
     * ==========================================
     */

    const disconnect = useCallback(async () => {
        try {
            if (device?.gatt?.connected) {
                device.gatt.disconnect();
            }
        } catch (error) {
            log(`Ошибка disconnect: ${error}`);
        }

        setDevice(null);
        setConnected(false);
        setCharacteristics([]);
        setSelectedCharacteristic(null);

        characteristicRef.current = null;

        setStatus("Отключено");

        log("Отключено");
    }, [device, log]);

    const sendPlt = useCallback(
        async (
            pltText,
            options
        ) => {
            if (!characteristicRef.current) {
                throw new Error(
                    'Cameo characteristic не выбрана'
                );
            }

            if (sending) {
                throw new Error(
                    'Cameo уже выполняет другое задание'
                );
            }

            try {
                setSending(true);
                setStatus('Подготовка резки...');

                log('================================');
                log('НАЧАЛО ОТПРАВКИ PLT');

                const commands = pltToGpgl(
                    pltText,
                    options
                );

                log(
                    `PLT преобразован в ${commands.length} GPGL команд`
                );

                for (
                    let i = 0;
                    i < commands.length;
                    i++
                ) {
                    const command = commands[i];

                    log(
                        `GPGL ${i + 1}/${commands.length}: ` +
                        hex(command)
                    );

                    await sendGpgl(command);
                }

                setStatus(
                    'Задание отправлено на Cameo'
                );

                log(
                    'ОТПРАВКА PLT ЗАВЕРШЕНА'
                );
            } catch (error) {
                log(
                    `Ошибка отправки PLT: ${error}`
                );

                setStatus(
                    'Ошибка отправки'
                );

                throw error;
            } finally {
                setSending(false);
            }
        },
        [
            hex,
            log,
            sending,
            sendGpgl,
        ]
    );

    return {
        device,
        connected,
        connecting,
        sending,

        characteristics,
        selectedCharacteristic,

        status,
        logs,

        connect,
        selectCharacteristic,
        queryFirmware,
        requestStatus,
        sendTestCut,
        disconnect,
        sendPlt
    };
}