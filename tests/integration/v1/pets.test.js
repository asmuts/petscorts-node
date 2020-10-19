let app;
const request = require("supertest");
const Pet = require("../../../services/models/pet");
const Owner = require("../../../services/models/owner");

describe("/api/v1/pets", () => {
  beforeEach(() => {
    app = require("../../../index");
  });
  afterEach(async () => {
    await Pet.remove({});
  });

  describe("GET /:id", () => {
    it("should return 404 if invalid id is passed", async () => {
      const res = await request(app).get("/api/v1/pets/1");

      expect(res.status).toBe(404);
    });
  });
});
