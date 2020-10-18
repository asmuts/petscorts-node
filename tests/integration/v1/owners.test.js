let server;
const request = require("supertest");
const Owner = require("../../../services/models/owner");

describe("/api/v1/owners", () => {
  beforeEach(() => {
    server = require("../../../index");
  });
  afterEach(async () => {
    server.close();
    await Owner.remove({});
  });

  describe("GET /", () => {
    it("should return all owners", async () => {
      await Owner.collection.insertMany([
        { username: "owner1", fullname: "name 1", email: "owner1@own.com" },
        { username: "owner2", fullname: "name 2", email: "owner2@own.com" },
      ]);

      const res = await request(server).get("/api/v1/owners");
      //console.log(res.body);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body.some((o) => o.username === "owner1")).toBeTruthy();
      expect(res.body.some((o) => o.username === "owner2")).toBeTruthy();
    });
  });

  describe("GET /:id", () => {
    it("should return Owner if valid id is passed", async () => {
      const newOwner = new Owner({
        username: "owner3",
        fullname: "name 3",
        email: "owner3@own.com",
      });
      await newOwner.save();

      const res = await request(server).get(`/api/v1/owners/${newOwner._id}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("fullname", newOwner.fullname);
      expect(res.body.username).toBe("owner3");
    });

    it("should return 404 if invalid id is passed", async () => {
      const res = await request(server).get("/api/v1/owners/1");

      expect(res.status).toBe(404);
    });
  });
});
