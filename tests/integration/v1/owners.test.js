let app;
const request = require("supertest");
const Owner = require("../../../services/models/owner");

describe("/api/v1/owners", () => {
  beforeAll(() => {
    // need to run the server on a different port than nodemon
    app = require("../../../index");
  });
  afterAll(async () => {
    await Owner.remove({});
  });

  describe("GET /", () => {
    it("should return all owners", async () => {
      await Owner.collection.insertMany([
        {
          username: "owner1",
          fullname: "name 1",
          email: "owner-int1@own.com",
          auth0_sub: "auth0_sub1",
        },
        {
          username: "owner2",
          fullname: "name 2",
          email: "owner-int2@own.com",
          auth0_sub: "auth0_sub2",
        },
      ]);

      const res = await request(app).get("/api/v1/owners");

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data.some((o) => o.username === "owner1")).toBeTruthy();
      expect(res.body.data.some((o) => o.username === "owner2")).toBeTruthy();
    });
  });

  describe("GET /:id", () => {
    it("should return Owner if valid id is passed", async () => {
      const newOwner = new Owner({
        username: "owner3",
        fullname: "name 3",
        email: "owner-int3@own.com",
      });
      await newOwner.save();

      const res = await request(app).get(`/api/v1/owners/${newOwner._id}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("fullname", newOwner.fullname);
      expect(res.body.data.username).toBe("owner3");
    });

    it("should return 404 if invalid id is passed", async () => {
      const res = await request(app).get("/api/v1/owners/1");

      expect(res.status).toBe(404);
    });
  });
});
