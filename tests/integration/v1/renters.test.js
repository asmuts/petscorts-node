let app;
const request = require("supertest");
const Renter = require("../../../services/models/renter");

describe("/api/v1/renters", () => {
  beforeEach(() => {
    app = require("../../../index");
  });
  afterEach(async () => {
    await Renter.remove({});
  });

  describe("GET /", () => {
    it("should return all renters", async () => {
      await Renter.collection.insertMany([
        { username: "renter1", fullname: "name 1", email: "renter1@own.com" },
        { username: "renter2", fullname: "name 2", email: "renter2@own.com" },
      ]);

      const res = await request(app).get("/api/v1/renters");

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body.some((o) => o.username === "renter1")).toBeTruthy();
      expect(res.body.some((o) => o.username === "renter2")).toBeTruthy();
    });
  });

  describe("GET /:id", () => {
    it("should return Renter if valid id is passed", async () => {
      const newRenter = new Renter({
        username: "renter3",
        fullname: "name 3",
        email: "renter3@own.com",
      });
      await newRenter.save();

      const res = await request(app).get(`/api/v1/renters/${newRenter._id}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("fullname", newRenter.fullname);
      expect(res.body.username).toBe("renter3");
    });

    it("should return 404 if invalid id is passed", async () => {
      const res = await request(app).get("/api/v1/renters/1");

      expect(res.status).toBe(404);
    });
  });
});
