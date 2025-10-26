import assert from "assert";
import { 
  TestHelpers,
  Escrow_BuyerIntent
} from "generated";
const { MockDb, Escrow } = TestHelpers;

describe("Escrow contract BuyerIntent event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for Escrow contract BuyerIntent event
  const event = Escrow.BuyerIntent.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("Escrow_BuyerIntent is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await Escrow.BuyerIntent.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualEscrowBuyerIntent = mockDbUpdated.entities.Escrow_BuyerIntent.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedEscrowBuyerIntent: Escrow_BuyerIntent = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      depositId: event.params.depositId,
      buyer: event.params.buyer,
      amount: event.params.amount,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(actualEscrowBuyerIntent, expectedEscrowBuyerIntent, "Actual EscrowBuyerIntent should be the same as the expectedEscrowBuyerIntent");
  });
});
