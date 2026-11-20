
const test = require("node:test");
const assert = require("node:assert/strict");

const {
    startGamificationWorker,
} = require("../src/workers/gamification.worker");

test("Worker waits for the active batch before stopping", async () => {
    let batchCount = 0;
    let finishBatch;

    let notifyBatchStarted;
    const batchStarted = new Promise((resolve) => {
        notifyBatchStarted = resolve;
    });

    const batchProcessor = () => {
        batchCount += 1;
        notifyBatchStarted();

        return new Promise((resolve) => {
            finishBatch = resolve;
        });
    };

    const worker = startGamificationWorker({
        batchProcessor,
        pollIntervalMs: 20,
    });

    // Wait until the first batch starts.
    await batchStarted;

    // Request shutdown while the batch is still running.
    const stopPromise = worker.stop();

    // Calling stop again must return the same promise.
    assert.strictEqual(worker.stop(), stopPromise);

    let stopCompleted = false;

    stopPromise.then(() => {
        stopCompleted = true;
    });

    // Allow pending promise callbacks to run.
    await new Promise((resolve) => setImmediate(resolve));

    // Worker must not stop while the batch is still active.
    assert.equal(stopCompleted, false);

    // Finish the active batch.
    finishBatch();

    // Wait for graceful shutdown to complete.
    await stopPromise;

    assert.equal(stopCompleted, true);

    // No additional batch should have started.
    assert.equal(batchCount, 1);
});
