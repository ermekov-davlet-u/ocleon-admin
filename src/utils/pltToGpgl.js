import { GPGL } from './gpgl';

export function pltToGpgl(
    pltText,
    options
) {
    const speed = options?.speed ?? 3;
    const force = options?.force ?? 5;
    const tool = options?.tool ?? 1;

    const commands = [];

    commands.push(
        GPGL.initialize()
    );

    commands.push(
        GPGL.selectTool(tool)
    );

    commands.push(
        GPGL.setSpeed(speed, tool)
    );

    commands.push(
        GPGL.setForce(force, tool)
    );

    commands.push(
        GPGL.toolUp({ tool })
    );

    let penDown = false;

    /**
     * HPGL/PLT команды обычно разделяются ;
     */
    const tokens = pltText
        .replace(/\r/g, '')
        .replace(/\n/g, '')
        .split(';')
        .map((x) => x.trim())
        .filter(Boolean);

    for (const token of tokens) {
        const command = token.substring(0, 2).toUpperCase();

        const data = token.substring(2);

        /**
         * PU = Pen Up
         */
        if (command === 'PU') {
            penDown = false;

            commands.push(
                GPGL.toolUp({ tool })
            );

            const points = parseCoordinates(data);

            if (points.length) {
                for (const point of points) {
                    commands.push(
                        GPGL.moveToMm(
                            point.x,
                            point.y
                        )
                    );
                }
            }

            continue;
        }

        /**
         * PD = Pen Down
         */
        if (command === 'PD') {
            const points = parseCoordinates(data);

            if (!penDown) {
                commands.push(
                    GPGL.toolDown({ tool })
                );

                penDown = true;
            }

            for (const point of points) {
                commands.push(
                    GPGL.drawToMm(
                        point.x,
                        point.y
                    )
                );
            }

            continue;
        }

        /**
         * SP = Select Pen
         */
        if (command === 'SP') {
            continue;
        }

        /**
         * IN = Initialize
         */
        if (command === 'IN') {
            commands.push(
                GPGL.initialize()
            );

            continue;
        }
    }

    if (penDown) {
        commands.push(
            GPGL.toolUp({ tool })
        );
    }

    return commands;
}


function parseCoordinates(
    value
) {
    if (!value.trim()) {
        return [];
    }

    /**
     * PLT обычно:
     *
     * PU0,0
     * PD100,0
     *
     * либо:
     *
     * PU0,0,100,0,100,100
     */

    const numbers = value
        .split(',')
        .map((x) => Number(x.trim()))
        .filter((x) => Number.isFinite(x));

    const points = [];

    for (
        let i = 0;
        i + 1 < numbers.length;
        i += 2
    ) {
        /**
         * HPGL обычно использует plotter units.
         *
         * Это место надо будет проверить
         * по твоему реальному .plt.
         */
        const x = numbers[i];
        const y = numbers[i + 1];

        /**
         * Здесь пока считаем:
         * 40 PLT units = 1 mm
         */
        points.push({
            x: x / 40,
            y: y / 40,
        });
    }

    return points;
}