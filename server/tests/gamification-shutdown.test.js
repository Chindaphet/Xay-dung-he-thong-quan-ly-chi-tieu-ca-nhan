
const assert = require("node:assert/strict");
const {
    startGamificationWorker,
} = require("../src/workers/gamification.worker");
const sleep = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms));

// Test 1: Shutdown waits for the active batch.
const testShutdownWaitsForActiveBatch = async () => {
    let batchStarted = false;
    let batchFinished = false;
    let batchCallCount = 0;
    const batchProcessor = async () => {
        batchCallCount += 1;
        batchStarted = true;
        await sleep(1000);
        batchFinished = true;
    };
    const worker = startGamificationWorker({
        batchProcessor,
        pollIntervalMs: 100,
    });
    await sleep(50);
    assert.equal(batchStarted, true);
    const shutdownPromise = worker.stop();
    assert.equal(batchFinished, false);
    await shutdownPromise;
    assert.equal(batchFinished, true);
    assert.equal(batchCallCount, 1);
    await worker.stop();

    console.log("PASS: Shutdown waits for the active batch.");
    console.log("PASS: No new batch starts after shutdown.");
    console.log("PASS: Calling stop() twice is safe.");
};

// Test 2: Worker recovers after a batch failure.
const testWorkerRecoversAfterBatchFailure = async () => {
    let batchCallCount = 0;
    let successfulBatchCount = 0;
    const batchProcessor = async () => {
        batchCallCount += 1;
        if (batchCallCount === 1) {
            throw new Error("Simulated batch failure.");
        }

        successfulBatchCount += 1;
    };
    const worker = startGamificationWorker({
        batchProcessor,
        pollIntervalMs: 100,
    });
    // Wait for the failed batch and the next successful batch.
    await sleep(300);
    assert.equal(
        batchCallCount >= 2,
        true,
        "Worker should retry on the next polling interval."
    );
    assert.equal(
        successfulBatchCount >= 1,
        true,
        "Worker should process a later batch successfully."
    );
    await worker.stop();
    console.log("PASS: Batch failure is handled.");
    console.log("PASS: Worker recovers on the next batch.");
    console.log("PASS: Worker shuts down after recovery.");
};

// Test 3: Worker shutdown times out but can still wait for the active batch.
const testShutdownTimeout = async () => {
    let batchCallCount = 0;
    let batchFinished = false;
    let releaseBatch;
    const batchProcessor = () => {
        batchCallCount += 1;
        return new Promise((resolve) => {
            releaseBatch = () => {
                batchFinished = true;
                resolve();
            };
        });
    };
    const worker = startGamificationWorker({
        batchProcessor,
        pollIntervalMs: 100,
    });
    await sleep(50);
    const firstStopPromise = worker.stop();
    const secondStopPromise = worker.stop();
    assert.equal(
        firstStopPromise,
        secondStopPromise,
        "Repeated stop() calls should return the same Promise."
    );
    await assert.rejects(
        firstStopPromise,
        /Shutdown timed out after 30 seconds/
    );
    assert.equal(batchFinished, false);
    assert.equal(batchCallCount, 1);
    console.log("PASS: Shutdown timeout is enforced.");
    console.log("PASS: Repeated stop() calls share the same Promise.");
    console.log("PASS: Active batch continues after timeout.");
    const waitPromise = worker.waitForCurrentBatch();
    assert.equal(batchFinished, false);
    releaseBatch();
    await waitPromise;
    assert.equal(batchFinished, true);
    console.log("PASS: waitForCurrentBatch() waits until the batch finishes.");
    console.log("PASS: No new batch starts after shutdown.");
};

// Run all tests.
const runTests = async () => {
    await testShutdownWaitsForActiveBatch();
    await testWorkerRecoversAfterBatchFailure();
    await testShutdownTimeout();
    console.log("\nAll Gamification Worker tests passed.");
};

runTests().catch((error) => {
    console.error("FAIL:", error);
    process.exitCode = 1;
    
});
