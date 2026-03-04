import { describe, test, expect } from "bun:test";
import { api, authenticatedApi, signUpTestUser, expectStatus, createTestFile, adminTokenApi } from "./helpers";

describe("API Integration Tests", () => {
  // Shared state for chaining tests
  let communityReportId: string;
  let slotIdentificationId: string;
  let slotMachineId: string;
  let unknownSlotReportId: string;
  let ngcbStatId: string;
  let authToken: string;
  let parSheetId: string;
  let jackpotId: string;
  let casinoId: string;
  let casinoSlotMachineId: string;
  let casinoDirectoryMachineId: string;
  let mustHitProgressiveId: string;
  let authUserId: string;

  // ============================================================================
  // Slot Machines
  // ============================================================================

  describe("GET /api/slot-machines", () => {
    test("List all slot machines successfully", async () => {
      const res = await api("/api/slot-machines");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      if (data.length > 0) {
        const machine = data[0];
        expect(machine.id).toBeDefined();
        expect(machine.brand).toBeDefined();
        expect(machine.gameTitle).toBeDefined();
        expect(Array.isArray(machine.commonDenoms)).toBe(true);
        slotMachineId = machine.id;
      }
    });
  });

  describe("GET /api/slot-machines/{id}", () => {
    test("Get specific slot machine details", async () => {
      const listRes = await api("/api/slot-machines");
      await expectStatus(listRes, 200);
      const machines = await listRes.json();

      if (machines.length > 0) {
        const machineId = machines[0].id;
        const res = await api(`/api/slot-machines/${machineId}`);
        await expectStatus(res, 200);

        const data = await res.json();
        expect(data.id).toBe(machineId);
        expect(data.brand).toBeDefined();
        expect(data.gameTitle).toBeDefined();
        expect(Array.isArray(data.commonDenoms)).toBe(true);
      }
    });

    test("Return 404 for non-existent slot machine ID", async () => {
      const res = await api("/api/slot-machines/00000000-0000-0000-0000-000000000000");
      await expectStatus(res, 404);

      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    test("Return 400 for invalid UUID format in slot machine ID", async () => {
      const res = await api("/api/slot-machines/invalid-uuid");
      await expectStatus(res, 400);
    });
  });

  describe("POST /api/slot-machines/search", () => {
    test("Search slot machines by query", async () => {
      const res = await api("/api/slot-machines/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "diamond",
        }),
      });
      await expectStatus(res, 200);

      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      if (data.length > 0) {
        const result = data[0];
        expect(result.id).toBeDefined();
        expect(result.brand).toBeDefined();
        expect(result.gameTitle).toBeDefined();
        expect(typeof result.confidence).toBe("number");
      }
    });

    test("Search with empty query returns results", async () => {
      const res = await api("/api/slot-machines/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "",
        }),
      });
      await expectStatus(res, 200);

      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });

    test("Reject search without query field", async () => {
      const res = await api("/api/slot-machines/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      await expectStatus(res, 400);

      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  describe("POST /api/slot-machines/report-unknown", () => {
    test("Report unknown slot machine successfully", async () => {
      const res = await api("/api/slot-machines/report-unknown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: "https://example.com/unknown-slot.jpg",
          brand: "Unknown Brand",
          gameTitle: "Mystery Game",
          notes: "Found at casino floor",
        }),
      });
      await expectStatus(res, 201);

      const data = await res.json();
      expect(data.id).toBeDefined();
      expect(typeof data.id).toBe("string");
      expect(data.status).toBeDefined();
      expect(data.message).toBeDefined();
      unknownSlotReportId = data.id;
    });

    test("Report unknown slot machine with minimal fields", async () => {
      const res = await api("/api/slot-machines/report-unknown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: "https://example.com/another-unknown.jpg",
        }),
      });
      await expectStatus(res, 201);

      const data = await res.json();
      expect(data.id).toBeDefined();
      expect(data.status).toBeDefined();
    });

    test("Report with optional userId", async () => {
      const res = await api("/api/slot-machines/report-unknown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: "https://example.com/userid-report.jpg",
          userId: "550e8400-e29b-41d4-a716-446655440000",
        }),
      });
      await expectStatus(res, 201);

      const data = await res.json();
      expect(data.id).toBeDefined();
      expect(data.status).toBeDefined();
    });

    test("Reject report without imageUrl", async () => {
      const res = await api("/api/slot-machines/report-unknown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: "IGT",
          gameTitle: "Some Game",
        }),
      });
      await expectStatus(res, 400);

      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  // ============================================================================
  // Uploads
  // ============================================================================

  describe("POST /api/upload/slot-image", () => {
    test("Upload slot machine image successfully", async () => {
      const form = new FormData();
      form.append("file", createTestFile("slot-image.jpg", "fake image data", "image/jpeg"));

      const res = await api("/api/upload/slot-image", {
        method: "POST",
        body: form,
      });
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.url).toBeDefined();
      expect(data.filename).toBeDefined();
    });

    test("Reject upload without file", async () => {
      const form = new FormData();

      const res = await api("/api/upload/slot-image", {
        method: "POST",
        body: form,
      });
      await expectStatus(res, 400);

      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  // ============================================================================
  // Icon Generation (AI)
  // ============================================================================

  describe("POST /api/generate-icon", () => {
    test("Generate icon with prompt", async () => {
      const res = await api("/api/generate-icon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "A slot machine with gold and diamonds",
        }),
      });
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.imageUrl).toBeDefined();
      expect(data.filename).toBeDefined();
    });

    test("Generate icon with custom size", async () => {
      const res = await api("/api/generate-icon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "A shiny slot machine",
          size: 512,
        }),
      });
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.imageUrl).toBeDefined();
      expect(data.filename).toBeDefined();
    });

    test("Reject generate-icon without prompt", async () => {
      const res = await api("/api/generate-icon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          size: 1024,
        }),
      });
      await expectStatus(res, 400);

      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  // ============================================================================
  // Slot Identification
  // ============================================================================

  describe("POST /api/identify-slot", () => {
    test("Identify slot from imageUrl", async () => {
      const res = await api("/api/identify-slot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: "https://example.com/slot-image.jpg",
        }),
      });
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.id).toBeDefined();
      expect(typeof data.id).toBe("string");
      expect(data.imageUrl).toBe("https://example.com/slot-image.jpg");
      expect(data.createdAt).toBeDefined();
      expect(data.disclaimer).toBeDefined();
      expect(typeof data.has_strong_match).toBe("boolean");
      expect(Array.isArray(data.matches)).toBe(true);
      expect(Array.isArray(data.ocr_text)).toBe(true);
      slotIdentificationId = data.id;
    });

    test("Identify slot with optional userId", async () => {
      const res = await api("/api/identify-slot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: "https://example.com/slot-image2.jpg",
          userId: "550e8400-e29b-41d4-a716-446655440000",
        }),
      });
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.id).toBeDefined();
      expect(data.imageUrl).toBe("https://example.com/slot-image2.jpg");
      expect(data.createdAt).toBeDefined();
    });

    test("Identify slot with optional casinoId", async () => {
      const res = await api("/api/identify-slot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: "https://example.com/slot-image3.jpg",
          casinoId: "550e8400-e29b-41d4-a716-446655440000",
        }),
      });
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.id).toBeDefined();
      expect(data.createdAt).toBeDefined();
    });

    test("Reject identify-slot without imageUrl", async () => {
      const res = await api("/api/identify-slot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      await expectStatus(res, 400);

      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  describe("GET /api/slot-identifications/{id}", () => {
    test("Get specific slot identification by ID", async () => {
      if (!slotIdentificationId) {
        return; // Skip if we don't have an ID
      }

      const res = await api(`/api/slot-identifications/${slotIdentificationId}`);
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.id).toBe(slotIdentificationId);
      expect(data.imageUrl).toBeDefined();
      expect(data.createdAt).toBeDefined();
      expect(Array.isArray(data.matches)).toBe(true);
    });

    test("Return 404 for non-existent slot identification", async () => {
      const res = await api("/api/slot-identifications/00000000-0000-0000-0000-000000000000");
      await expectStatus(res, 404);

      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    test("Return 400 for invalid UUID format in slot identification ID", async () => {
      const res = await api("/api/slot-identifications/invalid-uuid");
      await expectStatus(res, 400);
    });
  });

  // ============================================================================
  // Casinos
  // ============================================================================

  describe("GET /api/casinos", () => {
    test("List casinos successfully", async () => {
      const res = await api("/api/casinos");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      if (data.length > 0) {
        casinoId = data[0].id;
        expect(data[0].id).toBeDefined();
        expect(data[0].name).toBeDefined();
        expect(data[0].location).toBeDefined();
      }
    });
  });

  describe("GET /api/casinos/locations", () => {
    test("Get casino locations for map display", async () => {
      const res = await api("/api/casinos/locations");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      if (data.length > 0) {
        const casino = data[0];
        expect(casino.id).toBeDefined();
        expect(casino.name).toBeDefined();
        expect(casino.latitude === null || typeof casino.latitude === "string").toBe(true);
        expect(casino.longitude === null || typeof casino.longitude === "string").toBe(true);
        expect(casino.area === null || typeof casino.area === "string").toBe(true);
        expect(typeof casino.reportedCount).toBe("number");
      }
    });
  });

  // ============================================================================
  // Casino Slot Machines
  // ============================================================================

  describe("GET /api/casinos/{casinoId}/slot-machines", () => {
    test("Get slot machines for specific casino", async () => {
      if (!casinoId) {
        const casinoRes = await api("/api/casinos");
        await expectStatus(casinoRes, 200);
        const casinos = await casinoRes.json();
        if (casinos.length === 0) return;
        casinoId = casinos[0].id;
      }

      const res = await api(`/api/casinos/${casinoId}/slot-machines`);
      await expectStatus(res, 200);

      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      if (data.length > 0) {
        const sm = data[0];
        expect(sm.id).toBeDefined();
        expect(sm.slotMachineId).toBeDefined();
        expect(sm.brand).toBeDefined();
        expect(sm.gameTitle).toBeDefined();
        casinoSlotMachineId = sm.id;
      }
    });

    test("Return 404 for non-existent casino", async () => {
      const res = await api("/api/casinos/00000000-0000-0000-0000-000000000000/slot-machines");
      await expectStatus(res, 404);

      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    test("Return 400 for invalid UUID format in casino ID", async () => {
      const res = await api("/api/casinos/invalid-uuid/slot-machines");
      await expectStatus(res, 400);
    });
  });

  describe("POST /api/casinos/{casinoId}/slot-machines", () => {
    test("Link slot machine to casino", async () => {
      if (!casinoId) {
        const casinoRes = await api("/api/casinos");
        await expectStatus(casinoRes, 200);
        const casinos = await casinoRes.json();
        if (casinos.length === 0) return;
        casinoId = casinos[0].id;
      }

      if (!slotMachineId) {
        const machineRes = await api("/api/slot-machines");
        await expectStatus(machineRes, 200);
        const machines = await machineRes.json();
        if (machines.length === 0) return;
        slotMachineId = machines[0].id;
      }

      const res = await api(`/api/casinos/${casinoId}/slot-machines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotMachineId: slotMachineId,
          quantity: 5,
          floorLocation: "Main Floor",
          notes: "High popularity area",
        }),
      });

      if (res.status === 400 || res.status === 409) {
        const getRes = await api(`/api/casinos/${casinoId}/slot-machines`);
        await expectStatus(getRes, 200);
        const machines = await getRes.json();
        const existingLink = machines.find((m: any) => m.slotMachineId === slotMachineId);
        if (existingLink) {
          casinoSlotMachineId = existingLink.id;
          expect(existingLink.slotMachineId).toBe(slotMachineId);
          return;
        }
        throw new Error(`Expected 201 or to find existing link, got ${res.status}`);
      }

      await expectStatus(res, 201);

      const data = await res.json();
      expect(data.id).toBeDefined();
      expect(data.casinoId).toBe(casinoId);
      expect(data.slotMachineId).toBe(slotMachineId);
      expect(data.quantity).toBe(5);
      expect(data.floorLocation).toBe("Main Floor");
      expect(data.createdAt).toBeDefined();
      casinoSlotMachineId = data.id;
    });

    test("Link slot machine with minimal fields", async () => {
      if (!casinoId) {
        const casinoRes = await api("/api/casinos");
        await expectStatus(casinoRes, 200);
        const casinos = await casinoRes.json();
        if (casinos.length === 0) return;
        casinoId = casinos[0].id;
      }

      let secondMachineId: string;
      const machineRes = await api("/api/slot-machines");
      await expectStatus(machineRes, 200);
      const machines = await machineRes.json();
      if (machines.length < 2) return;
      secondMachineId = machines[1].id;

      const res = await api(`/api/casinos/${casinoId}/slot-machines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotMachineId: secondMachineId,
        }),
      });

      if (res.status === 400 || res.status === 409) {
        const getRes = await api(`/api/casinos/${casinoId}/slot-machines`);
        await expectStatus(getRes, 200);
        const casinoMachines = await getRes.json();
        const existingLink = casinoMachines.find((m: any) => m.slotMachineId === secondMachineId);
        if (existingLink) {
          expect(existingLink.slotMachineId).toBe(secondMachineId);
          return;
        }
        throw new Error(`Expected 201 or to find existing link, got ${res.status}`);
      }

      await expectStatus(res, 201);

      const data = await res.json();
      expect(data.id).toBeDefined();
      expect(data.casinoId).toBe(casinoId);
      expect(data.slotMachineId).toBe(secondMachineId);
    });

    test("Reject link without slotMachineId", async () => {
      if (!casinoId) {
        const casinoRes = await api("/api/casinos");
        await expectStatus(casinoRes, 200);
        const casinos = await casinoRes.json();
        if (casinos.length === 0) return;
        casinoId = casinos[0].id;
      }

      const res = await api(`/api/casinos/${casinoId}/slot-machines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: 5,
        }),
      });
      await expectStatus(res, 400);

      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    test("Return 404 for non-existent casino when linking", async () => {
      if (!slotMachineId) {
        const machineRes = await api("/api/slot-machines");
        await expectStatus(machineRes, 200);
        const machines = await machineRes.json();
        if (machines.length === 0) return;
        slotMachineId = machines[0].id;
      }

      const res = await api("/api/casinos/00000000-0000-0000-0000-000000000000/slot-machines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotMachineId: slotMachineId,
        }),
      });
      await expectStatus(res, 404);

      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  describe("PUT /api/casinos/{casinoId}/slot-machines/{id}", () => {
    test("Update casino-slot machine relationship", async () => {
      if (!casinoId || !casinoSlotMachineId) {
        return;
      }

      const res = await api(`/api/casinos/${casinoId}/slot-machines/${casinoSlotMachineId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: 10,
          floorLocation: "Updated Location",
          notes: "Updated notes",
        }),
      });
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.id).toBe(casinoSlotMachineId);
      expect(data.quantity).toBe(10);
      expect(data.floorLocation).toBe("Updated Location");
    });

    test("Return 404 when updating non-existent casino-machine relationship", async () => {
      if (!casinoId) {
        const casinoRes = await api("/api/casinos");
        await expectStatus(casinoRes, 200);
        const casinos = await casinoRes.json();
        if (casinos.length === 0) return;
        casinoId = casinos[0].id;
      }

      const res = await api(`/api/casinos/${casinoId}/slot-machines/00000000-0000-0000-0000-000000000000`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: 5,
        }),
      });
      await expectStatus(res, 404);

      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  describe("DELETE /api/casinos/{casinoId}/slot-machines/{id}", () => {
    test("Remove slot machine from casino", async () => {
      if (!casinoId) {
        return;
      }

      const machineRes = await api("/api/slot-machines");
      await expectStatus(machineRes, 200);
      const machines = await machineRes.json();
      if (machines.length < 3) return;
      const machineToDelete = machines[2].id;

      const createRes = await api(`/api/casinos/${casinoId}/slot-machines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotMachineId: machineToDelete,
        }),
      });

      let linkId: string;
      if (createRes.status === 400 || createRes.status === 409) {
        const getRes = await api(`/api/casinos/${casinoId}/slot-machines`);
        await expectStatus(getRes, 200);
        const casinoMachines = await getRes.json();
        const existingLink = casinoMachines.find((m: any) => m.slotMachineId === machineToDelete);
        if (!existingLink) {
          return;
        }
        linkId = existingLink.id;
      } else {
        await expectStatus(createRes, 201);
        const createdData = await createRes.json();
        linkId = createdData.id;
      }

      const deleteRes = await api(`/api/casinos/${casinoId}/slot-machines/${linkId}`, {
        method: "DELETE",
      });
      await expectStatus(deleteRes, 200);

      const data = await deleteRes.json();
      expect(data.success).toBe(true);
    });

    test("Return 404 when deleting non-existent relationship", async () => {
      if (!casinoId) {
        const casinoRes = await api("/api/casinos");
        await expectStatus(casinoRes, 200);
        const casinos = await casinoRes.json();
        if (casinos.length === 0) return;
        casinoId = casinos[0].id;
      }

      const res = await api(`/api/casinos/${casinoId}/slot-machines/00000000-0000-0000-0000-000000000000`, {
        method: "DELETE",
      });
      await expectStatus(res, 404);

      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  // ============================================================================
  // NGCB Stats
  // ============================================================================

  describe("GET /api/ngcb-stats", () => {
    test("Get all NGCB statistics", async () => {
      const res = await api("/api/ngcb-stats");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      if (data.length > 0) {
        const stat = data[0];
        expect(stat.id).toBeDefined();
        expect(stat.reportMonth).toBeDefined();
        expect(stat.locationArea).toBeDefined();
        expect(stat.denomination).toBeDefined();
        expect(stat.avgRtpPercent).toBeDefined();
        expect(stat.holdPercent).toBeDefined();
        expect(stat.numMachines).toBeDefined();
        expect(stat.createdAt).toBeDefined();
        expect(stat.disclaimer).toBeDefined();
      }
    });
  });

  describe("POST /api/ngcb-stats", () => {
    test("Create NGCB statistic with authentication", async () => {
      const { token, user } = await signUpTestUser();
      authToken = token;
      authUserId = user.id;

      const res = await authenticatedApi("/api/ngcb-stats", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportMonth: "2026-02",
          locationArea: "Test Area",
          denomination: "1¢",
          avgRtpPercent: 95.5,
          holdPercent: 4.5,
          numMachines: 100,
          notes: "Test data",
        }),
      });
      await expectStatus(res, 201);

      const data = await res.json();
      expect(data.id).toBeDefined();
      expect(data.reportMonth).toBe("2026-02");
      expect(data.locationArea).toBe("Test Area");
      expect(data.denomination).toBe("1¢");
      expect(data.createdAt).toBeDefined();
      expect(data.disclaimer).toBeDefined();
      ngcbStatId = data.id;
    });

    test("Reject NGCB stat creation without authentication", async () => {
      const res = await api("/api/ngcb-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportMonth: "2026-02",
          locationArea: "Test Area",
          denomination: "1¢",
          avgRtpPercent: 95.5,
          holdPercent: 4.5,
          numMachines: 100,
        }),
      });
      await expectStatus(res, 401);

      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    test("Reject NGCB stat creation with missing required field", async () => {
      const { token } = await signUpTestUser();

      const res = await authenticatedApi("/api/ngcb-stats", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportMonth: "2026-02",
          locationArea: "Test Area",
          avgRtpPercent: 95.5,
          holdPercent: 4.5,
          numMachines: 100,
        }),
      });
      await expectStatus(res, 400);

      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  describe("GET /api/ngcb-stats/latest", () => {
    test("Get latest NGCB statistics without filters", async () => {
      const res = await api("/api/ngcb-stats/latest");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.reportMonth).toBeDefined();
      expect(data.locationArea).toBeDefined();
      expect(data.denomination).toBeDefined();
      expect(data.avgRtpPercent).toBeDefined();
      expect(data.disclaimer).toBeDefined();
    });

    test("Get latest NGCB statistics with area filter", async () => {
      const res = await api("/api/ngcb-stats/latest?area=Strip");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.locationArea).toBeDefined();
      expect(data.avgRtpPercent).toBeDefined();
    });

    test("Get latest NGCB statistics with denomination filter", async () => {
      const res = await api("/api/ngcb-stats/latest?denomination=1%C2%A2");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.denomination).toBeDefined();
    });

    test("Return 404 for non-existent area/denomination combination", async () => {
      const res = await api("/api/ngcb-stats/latest?area=NonExistentArea&denomination=InvalidDenom");
      await expectStatus(res, 404);

      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  describe("GET /api/ngcb-stats/report/{month}", () => {
    test("Get NGCB statistics for specific month", async () => {
      const res = await api("/api/ngcb-stats/report/2026-02");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      if (data.length > 0) {
        const stat = data[0];
        expect(stat.locationArea).toBeDefined();
        expect(stat.denomination).toBeDefined();
        expect(stat.avgRtpPercent).toBeDefined();
        expect(stat.holdPercent).toBeDefined();
        expect(stat.numMachines).toBeDefined();
      }
    });

    test("Return 400 for invalid month format", async () => {
      const res = await api("/api/ngcb-stats/report/invalid-month");
      await expectStatus(res, 400);

      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  describe("GET /api/ngcb-stats/{area}/{denomination}", () => {
    test("Get NGCB stats for valid area and denomination", async () => {
      const res = await api("/api/ngcb-stats/Strip/penny");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.area).toBe("Strip");
      expect(data.denomination).toBe("penny");
      expect(data.averagePayback).toBeDefined();
      expect(typeof data.averagePayback).toBe("number");
      expect(data.month).toBeDefined();
      expect(data.disclaimer).toBeDefined();
    });

    test("Get NGCB stats for different denomination", async () => {
      const res = await api("/api/ngcb-stats/Downtown/quarter");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.area).toBe("Downtown");
      expect(data.denomination).toBe("quarter");
      expect(data.averagePayback).toBeDefined();
    });

    test("Return 404 for non-existent area/denomination combination", async () => {
      const res = await api("/api/ngcb-stats/InvalidArea/invaliddenomination");
      await expectStatus(res, 404);

      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  describe("PUT /api/ngcb-stats/{id}", () => {
    test("Update NGCB statistic with authentication", async () => {
      const res = await authenticatedApi(`/api/ngcb-stats/${ngcbStatId}`, authToken, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportMonth: "2026-02",
          locationArea: "Updated Area",
          denomination: "5¢",
          avgRtpPercent: 96.0,
          holdPercent: 4.0,
          numMachines: 150,
          notes: "Updated test data",
        }),
      });
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.id).toBe(ngcbStatId);
      expect(data.locationArea).toBe("Updated Area");
      expect(data.denomination).toBe("5¢");
      expect(data.numMachines).toBe("150");
    });

    test("Reject update without authentication", async () => {
      const res = await api(`/api/ngcb-stats/${ngcbStatId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationArea: "Should Fail",
        }),
      });
      await expectStatus(res, 401);

      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    test("Return 404 when updating non-existent NGCB stat", async () => {
      const { token } = await signUpTestUser();

      const res = await authenticatedApi("/api/ngcb-stats/00000000-0000-0000-0000-000000000000", token, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationArea: "Test",
        }),
      });
      await expectStatus(res, 404);

      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  describe("DELETE /api/ngcb-stats/{id}", () => {
    test("Delete NGCB statistic with authentication", async () => {
      const createRes = await authenticatedApi("/api/ngcb-stats", authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportMonth: "2026-03",
          locationArea: "Delete Test Area",
          denomination: "25¢",
          avgRtpPercent: 94.0,
          holdPercent: 6.0,
          numMachines: 200,
        }),
      });
      await expectStatus(createRes, 201);
      const createdData = await createRes.json();
      const deleteId = createdData.id;

      const deleteRes = await authenticatedApi(`/api/ngcb-stats/${deleteId}`, authToken, {
        method: "DELETE",
      });
      await expectStatus(deleteRes, 200);

      const data = await deleteRes.json();
      expect(data.success).toBe(true);
    });

    test("Reject delete without authentication", async () => {
      const res = await api(`/api/ngcb-stats/${ngcbStatId}`, {
        method: "DELETE",
      });
      await expectStatus(res, 401);

      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    test("Return 404 when deleting non-existent NGCB stat", async () => {
      const { token } = await signUpTestUser();

      const res = await authenticatedApi("/api/ngcb-stats/00000000-0000-0000-0000-000000000000", token, {
        method: "DELETE",
      });
      await expectStatus(res, 404);

      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  // ============================================================================
  // NGCB Trends
  // ============================================================================

  describe("GET /api/ngcb-trends", () => {
    test("Get historical NGCB slot hold % trends without filters", async () => {
      const res = await api("/api/ngcb-trends");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.trends).toBeDefined();
      expect(Array.isArray(data.trends)).toBe(true);
      expect(data.disclaimer).toBeDefined();
      if (data.trends.length > 0) {
        const trend = data.trends[0];
        expect(trend.reportMonth).toBeDefined();
        expect(trend.locationArea).toBeDefined();
        expect(typeof trend.holdPercent).toBe("number");
        expect(typeof trend.rtpPercent).toBe("number");
      }
    });

    test("Get NGCB trends with startMonth filter", async () => {
      const res = await api("/api/ngcb-trends?startMonth=2025-01");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.trends).toBeDefined();
      expect(Array.isArray(data.trends)).toBe(true);
    });

    test("Get NGCB trends with endMonth filter", async () => {
      const res = await api("/api/ngcb-trends?endMonth=2025-12");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.trends).toBeDefined();
      expect(Array.isArray(data.trends)).toBe(true);
    });

    test("Get NGCB trends with areas filter", async () => {
      const res = await api("/api/ngcb-trends?areas=Strip,Downtown");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.trends).toBeDefined();
      expect(Array.isArray(data.trends)).toBe(true);
    });

    test("Get NGCB trends with mode filter set to rtp", async () => {
      const res = await api("/api/ngcb-trends?mode=rtp");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.trends).toBeDefined();
      expect(Array.isArray(data.trends)).toBe(true);
      expect(data.disclaimer).toBeDefined();
    });

    test("Get NGCB trends with all filter parameters", async () => {
      const res = await api("/api/ngcb-trends?startMonth=2024-01&endMonth=2025-12&areas=Strip&mode=hold");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.trends).toBeDefined();
      expect(Array.isArray(data.trends)).toBe(true);
      expect(data.disclaimer).toBeDefined();
    });
  });

  // ============================================================================
  // Par Sheets CRUD
  // ============================================================================

  describe("GET /api/par-sheets", () => {
    test("List all par sheets successfully", async () => {
      const res = await api("/api/par-sheets");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      if (data.length > 0) {
        const sheet = data[0];
        expect(sheet.id).toBeDefined();
        expect(sheet.gameTitle).toBeDefined();
        expect(sheet.brand).toBeDefined();
        expect(sheet.rtpRangeLow).toBeDefined();
        expect(sheet.rtpRangeHigh).toBeDefined();
        expect(sheet.volatility).toBeDefined();
        expect(sheet.typicalDenoms).toBeDefined();
        expect(sheet.notes).toBeDefined();
        expect(sheet.createdAt).toBeDefined();
        parSheetId = sheet.id;
      }
    });
  });

  describe("POST /api/par-sheets", () => {
    test("Create par sheet successfully", async () => {
      const res = await api("/api/par-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameTitle: "Test Slot Game",
          brand: "TestBrand",
          rtpRangeLow: 92.0,
          rtpRangeHigh: 96.0,
          volatility: "High",
          typicalDenoms: "1¢, 5¢, 25¢",
          notes: "Test par sheet",
          sourceLink: "https://example.com/source",
        }),
      });
      await expectStatus(res, 201);

      const data = await res.json();
      expect(data.id).toBeDefined();
      expect(typeof data.id).toBe("string");
      expect(data.gameTitle).toBe("Test Slot Game");
      expect(data.brand).toBe("TestBrand");
      expect(data.rtpRangeLow).toBe("92.0");
      expect(data.rtpRangeHigh).toBe("96.0");
      expect(data.createdAt).toBeDefined();
      parSheetId = data.id;
    });

    test("Create par sheet with minimal required fields", async () => {
      const res = await api("/api/par-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameTitle: "Minimal Sheet",
          brand: "Brand2",
          rtpRangeLow: 94.0,
          rtpRangeHigh: 95.0,
          volatility: "Low",
          typicalDenoms: "25¢",
          notes: "Minimal test",
        }),
      });
      await expectStatus(res, 201);

      const data = await res.json();
      expect(data.id).toBeDefined();
      expect(data.gameTitle).toBe("Minimal Sheet");
    });

    test("Reject par sheet without required field", async () => {
      const res = await api("/api/par-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameTitle: "Missing Brand",
          rtpRangeLow: 94.0,
          rtpRangeHigh: 95.0,
          volatility: "Low",
          typicalDenoms: "25¢",
          notes: "Should fail",
        }),
      });
      await expectStatus(res, 400);

      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  describe("GET /api/par-sheets/{id}", () => {
    test("Get specific par sheet by ID", async () => {
      if (!parSheetId) {
        const listRes = await api("/api/par-sheets");
        await expectStatus(listRes, 200);
        const sheets = await listRes.json();
        if (sheets.length === 0) return;
        parSheetId = sheets[0].id;
      }

      const res = await api(`/api/par-sheets/${parSheetId}`);
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.id).toBe(parSheetId);
      expect(data.gameTitle).toBeDefined();
      expect(data.brand).toBeDefined();
      expect(data.rtpRangeLow).toBeDefined();
      expect(data.rtpRangeHigh).toBeDefined();
    });

    test("Return 404 for non-existent par sheet ID", async () => {
      const res = await api("/api/par-sheets/00000000-0000-0000-0000-000000000000");
      await expectStatus(res, 404);

      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    test("Return 400 for invalid UUID format in par sheet ID", async () => {
      const res = await api("/api/par-sheets/invalid-uuid");
      await expectStatus(res, 400);
    });
  });

  describe("PUT /api/par-sheets/{id}", () => {
    test("Update par sheet successfully", async () => {
      if (!parSheetId) {
        return;
      }

      const res = await api(`/api/par-sheets/${parSheetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameTitle: "Updated Title",
          brand: "UpdatedBrand",
          rtpRangeLow: 93.0,
          rtpRangeHigh: 97.0,
          volatility: "Medium",
          typicalDenoms: "5¢, 25¢",
          notes: "Updated notes",
        }),
      });
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.id).toBe(parSheetId);
      expect(data.gameTitle).toBe("Updated Title");
      expect(data.brand).toBe("UpdatedBrand");
    });

    test("Return 404 when updating non-existent par sheet", async () => {
      const res = await api("/api/par-sheets/00000000-0000-0000-0000-000000000000", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameTitle: "Updated",
        }),
      });
      await expectStatus(res, 404);

      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  describe("DELETE /api/par-sheets/{id}", () => {
    test("Delete par sheet successfully", async () => {
      const createRes = await api("/api/par-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameTitle: "To Delete",
          brand: "DeleteTest",
          rtpRangeLow: 91.0,
          rtpRangeHigh: 98.0,
          volatility: "High",
          typicalDenoms: "All",
          notes: "This will be deleted",
        }),
      });
      await expectStatus(createRes, 201);
      const createdData = await createRes.json();
      const deleteId = createdData.id;

      const deleteRes = await api(`/api/par-sheets/${deleteId}`, {
        method: "DELETE",
      });
      await expectStatus(deleteRes, 200);

      const data = await deleteRes.json();
      expect(data.success).toBe(true);
    });

    test("Return 404 when deleting non-existent par sheet", async () => {
      const res = await api("/api/par-sheets/00000000-0000-0000-0000-000000000000", {
        method: "DELETE",
      });
      await expectStatus(res, 404);

      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  describe("GET /api/par-sheets/search", () => {
    test("Search par sheets by gameTitle", async () => {
      const res = await api("/api/par-sheets/search?gameTitle=test");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      if (data.length > 0) {
        const result = data[0];
        expect(result.id).toBeDefined();
        expect(result.gameTitle).toBeDefined();
        expect(result.brand).toBeDefined();
      }
    });

    test("Search par sheets without filters", async () => {
      const res = await api("/api/par-sheets/search");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });

    test("Search par sheets with empty gameTitle", async () => {
      const res = await api("/api/par-sheets/search?gameTitle=");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  // ============================================================================
  // Jackpot Feed CRUD
  // ============================================================================

  describe("GET /api/jackpot-feed", () => {
    test("Get all jackpots ordered by current amount", async () => {
      const res = await api("/api/jackpot-feed");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.jackpots).toBeDefined();
      expect(Array.isArray(data.jackpots)).toBe(true);
      expect(data.disclaimer).toBeDefined();
      if (data.jackpots.length > 0) {
        const jackpot = data.jackpots[0];
        expect(jackpot.id).toBeDefined();
        expect(jackpot.jackpotName).toBeDefined();
        expect(typeof jackpot.currentAmount).toBe("number");
        expect(jackpot.location).toBeDefined();
        expect(jackpot.lastUpdated).toBeDefined();
        expect(jackpot.trackerLink).toBeDefined();
        jackpotId = jackpot.id;
      }
    });
  });

  describe("POST /api/jackpot-feed", () => {
    test("Create jackpot entry successfully", async () => {
      const res = await api("/api/jackpot-feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jackpotName: "Mega Moolah",
          currentAmount: 5000000.50,
          location: "Luxor Las Vegas",
          lastUpdated: new Date().toISOString(),
          trackerLink: "https://example.com/tracker",
          notes: "Test jackpot entry",
        }),
      });
      await expectStatus(res, 201);

      const data = await res.json();
      expect(data.id).toBeDefined();
      expect(typeof data.id).toBe("string");
      expect(data.jackpotName).toBe("Mega Moolah");
      expect(data.currentAmount).toBe(5000000.50);
      expect(data.location).toBe("Luxor Las Vegas");
      expect(data.createdAt).toBeDefined();
      expect(data.disclaimer).toBeDefined();
      jackpotId = data.id;
    });

    test("Create jackpot entry with minimal required fields", async () => {
      const res = await api("/api/jackpot-feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jackpotName: "Test Jackpot",
          currentAmount: 1000000,
          location: "Test Casino",
          lastUpdated: new Date().toISOString(),
          trackerLink: "https://example.com/tracker2",
        }),
      });
      await expectStatus(res, 201);

      const data = await res.json();
      expect(data.id).toBeDefined();
      expect(data.jackpotName).toBe("Test Jackpot");
    });

    test("Reject jackpot without jackpotName", async () => {
      const res = await api("/api/jackpot-feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentAmount: 1000000,
          location: "Test Casino",
          lastUpdated: new Date().toISOString(),
          trackerLink: "https://example.com/tracker",
        }),
      });
      await expectStatus(res, 400);

      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    test("Reject jackpot without currentAmount", async () => {
      const res = await api("/api/jackpot-feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jackpotName: "Test",
          location: "Test Casino",
          lastUpdated: new Date().toISOString(),
          trackerLink: "https://example.com/tracker",
        }),
      });
      await expectStatus(res, 400);

      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    test("Reject jackpot without location", async () => {
      const res = await api("/api/jackpot-feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jackpotName: "Test",
          currentAmount: 1000000,
          lastUpdated: new Date().toISOString(),
          trackerLink: "https://example.com/tracker",
        }),
      });
      await expectStatus(res, 400);

      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    test("Reject jackpot without trackerLink", async () => {
      const res = await api("/api/jackpot-feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jackpotName: "Test",
          currentAmount: 1000000,
          location: "Test Casino",
          lastUpdated: new Date().toISOString(),
        }),
      });
      await expectStatus(res, 400);

      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    test("Reject jackpot without lastUpdated", async () => {
      const res = await api("/api/jackpot-feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jackpotName: "Test",
          currentAmount: 1000000,
          location: "Test Casino",
          trackerLink: "https://example.com/tracker",
        }),
      });
      await expectStatus(res, 400);

      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  describe("PUT /api/jackpot-feed/{id}", () => {
    test("Update jackpot entry successfully", async () => {
      if (!jackpotId) {
        const listRes = await api("/api/jackpot-feed");
        await expectStatus(listRes, 200);
        const { jackpots } = await listRes.json();
        if (jackpots.length === 0) return;
        jackpotId = jackpots[0].id;
      }

      const res = await api(`/api/jackpot-feed/${jackpotId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jackpotName: "Updated Jackpot",
          currentAmount: 6000000,
          location: "Updated Location",
          lastUpdated: new Date().toISOString(),
          trackerLink: "https://example.com/updated-tracker",
          notes: "Updated notes",
        }),
      });
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.id).toBe(jackpotId);
      expect(data.jackpotName).toBe("Updated Jackpot");
      expect(data.currentAmount).toBe(6000000);
      expect(data.location).toBe("Updated Location");
    });

    test("Return 404 when updating non-existent jackpot", async () => {
      const res = await api("/api/jackpot-feed/00000000-0000-0000-0000-000000000000", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jackpotName: "Updated",
          currentAmount: 1000000,
        }),
      });
      await expectStatus(res, 404);

      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  describe("DELETE /api/jackpot-feed/{id}", () => {
    test("Delete jackpot entry successfully", async () => {
      const createRes = await api("/api/jackpot-feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jackpotName: "To Delete",
          currentAmount: 2000000,
          location: "Delete Test Casino",
          lastUpdated: new Date().toISOString(),
          trackerLink: "https://example.com/delete-tracker",
          notes: "This will be deleted",
        }),
      });
      await expectStatus(createRes, 201);
      const createdData = await createRes.json();
      const deleteId = createdData.id;

      const deleteRes = await api(`/api/jackpot-feed/${deleteId}`, {
        method: "DELETE",
      });
      await expectStatus(deleteRes, 200);

      const data = await deleteRes.json();
      expect(data.success).toBe(true);
    });

    test("Return 404 when deleting non-existent jackpot", async () => {
      const res = await api("/api/jackpot-feed/00000000-0000-0000-0000-000000000000", {
        method: "DELETE",
      });
      await expectStatus(res, 404);

      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  // ============================================================================
  // Must-Hit Progressives
  // ============================================================================

  describe("GET /api/must-hit-progressives", () => {
    test("Get all must-hit progressives sorted by percentage to cap", async () => {
      const res = await api("/api/must-hit-progressives");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.progressives).toBeDefined();
      expect(Array.isArray(data.progressives)).toBe(true);
      expect(data.disclaimer).toBeDefined();
      if (data.progressives.length > 0) {
        const progressive = data.progressives[0];
        expect(progressive.id).toBeDefined();
        expect(progressive.gameTitle).toBeDefined();
        expect(progressive.casino).toBeDefined();
        expect(progressive.minorCap).toBeDefined();
        expect(progressive.majorCap).toBeDefined();
        expect(progressive.currentMinor).toBeDefined();
        expect(progressive.currentMajor).toBeDefined();
        expect(progressive.lastReported).toBeDefined();
        expect(typeof progressive.minorPercentage).toBe("number");
        expect(typeof progressive.majorPercentage).toBe("number");
        mustHitProgressiveId = progressive.id;
      }
    });
  });

  describe("POST /api/must-hit-progressives", () => {
    test("Create must-hit progressive successfully", async () => {
      const res = await api("/api/must-hit-progressives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameTitle: "Test Progressive Game",
          casino: "Test Casino",
          minorCap: 5000,
          majorCap: 50000,
          currentMinor: 3000,
          currentMajor: 35000,
          notes: "Test progressive",
        }),
      });
      await expectStatus(res, 201);

      const data = await res.json();
      expect(data.id).toBeDefined();
      expect(typeof data.id).toBe("string");
      expect(data.gameTitle).toBe("Test Progressive Game");
      expect(data.casino).toBe("Test Casino");
      expect(data.minorCap).toBe("5000");
      expect(data.majorCap).toBe("50000");
      expect(data.currentMinor).toBe("3000");
      expect(data.currentMajor).toBe("35000");
      expect(data.lastReported).toBeDefined();
      mustHitProgressiveId = data.id;
    });

    test("Reject progressive without required field", async () => {
      const res = await api("/api/must-hit-progressives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameTitle: "Missing Casino",
          minorCap: 5000,
          majorCap: 50000,
          currentMinor: 3000,
          currentMajor: 35000,
        }),
      });
      await expectStatus(res, 400);
    });
  });

  describe("POST /api/must-hit-progressives/report-sighting", () => {
    test("Report current amounts for must-hit progressive", async () => {
      if (!mustHitProgressiveId) {
        return;
      }

      const res = await api("/api/must-hit-progressives/report-sighting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: mustHitProgressiveId,
          currentMinor: 4000,
          currentMajor: 40000,
        }),
      });
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.progressive).toBeDefined();
      expect(data.progressive.id).toBe(mustHitProgressiveId);
      expect(data.progressive.currentMinor).toBe("4000");
      expect(data.progressive.currentMajor).toBe("40000");
      expect(data.progressive.lastReported).toBeDefined();
      expect(data.disclaimer).toBeDefined();
    });

    test("Report sighting with only currentMinor", async () => {
      if (!mustHitProgressiveId) {
        return;
      }

      const res = await api("/api/must-hit-progressives/report-sighting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: mustHitProgressiveId,
          currentMinor: 4500,
        }),
      });
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.success).toBe(true);
    });

    test("Return 404 for non-existent progressive", async () => {
      const res = await api("/api/must-hit-progressives/report-sighting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "00000000-0000-0000-0000-000000000000",
          currentMinor: 5000,
        }),
      });
      await expectStatus(res, 404);

      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  describe("PUT /api/must-hit-progressives/{id}", () => {
    test("Update must-hit progressive", async () => {
      if (!mustHitProgressiveId) {
        return;
      }

      const res = await api(`/api/must-hit-progressives/${mustHitProgressiveId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameTitle: "Updated Progressive",
          casino: "Updated Casino",
          currentMinor: 4200,
          currentMajor: 42000,
        }),
      });
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.id).toBe(mustHitProgressiveId);
      expect(data.gameTitle).toBe("Updated Progressive");
      expect(data.casino).toBe("Updated Casino");
      expect(data.currentMinor).toBe("4200");
      expect(data.currentMajor).toBe("42000");
    });

    test("Return 404 when updating non-existent progressive", async () => {
      const res = await api("/api/must-hit-progressives/00000000-0000-0000-0000-000000000000", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameTitle: "Updated",
        }),
      });
      await expectStatus(res, 404);

      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  describe("DELETE /api/must-hit-progressives/{id}", () => {
    test("Delete must-hit progressive", async () => {
      const createRes = await api("/api/must-hit-progressives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameTitle: "To Delete",
          casino: "Delete Test",
          minorCap: 5000,
          majorCap: 50000,
          currentMinor: 3000,
          currentMajor: 35000,
        }),
      });
      await expectStatus(createRes, 201);
      const createdData = await createRes.json();
      const deleteId = createdData.id;

      const deleteRes = await api(`/api/must-hit-progressives/${deleteId}`, {
        method: "DELETE",
      });
      await expectStatus(deleteRes, 200);

      const data = await deleteRes.json();
      expect(data.success).toBe(true);
    });

    test("Return 404 when deleting non-existent progressive", async () => {
      const res = await api("/api/must-hit-progressives/00000000-0000-0000-0000-000000000000", {
        method: "DELETE",
      });
      await expectStatus(res, 404);

      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  // ============================================================================
  // Player Tools - Educational Content
  // ============================================================================

  describe("GET /api/player-tools/myths-vs-facts", () => {
    test("Get myths vs facts educational content", async () => {
      const res = await api("/api/player-tools/myths-vs-facts");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.myths).toBeDefined();
      expect(Array.isArray(data.myths)).toBe(true);
      expect(data.disclaimer).toBeDefined();
      if (data.myths.length > 0) {
        const item = data.myths[0];
        expect(item.myth).toBeDefined();
        expect(item.fact).toBeDefined();
      }
    });
  });

  describe("GET /api/player-tools/game-recommendations", () => {
    test("Get game recommendations for different player types", async () => {
      const res = await api("/api/player-tools/game-recommendations");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.recommendations).toBeDefined();
      expect(Array.isArray(data.recommendations)).toBe(true);
      expect(data.disclaimer).toBeDefined();
      if (data.recommendations.length > 0) {
        const rec = data.recommendations[0];
        expect(rec.playerType).toBeDefined();
        expect(Array.isArray(rec.games)).toBe(true);
      }
    });
  });

  describe("GET /api/player-tools/bankroll-tips", () => {
    test("Get bankroll management tips", async () => {
      const res = await api("/api/player-tools/bankroll-tips");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.tips).toBeDefined();
      expect(Array.isArray(data.tips)).toBe(true);
      expect(data.disclaimer).toBeDefined();
      if (data.tips.length > 0) {
        expect(typeof data.tips[0]).toBe("string");
      }
    });
  });

  // ============================================================================
  // Gamification - Badges and Achievements
  // ============================================================================

  describe("GET /api/gamification/badges", () => {
    test("Get all available badge definitions", async () => {
      const res = await api("/api/gamification/badges");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.badges).toBeDefined();
      expect(Array.isArray(data.badges)).toBe(true);
      if (data.badges.length > 0) {
        const badge = data.badges[0];
        expect(badge.name).toBeDefined();
        expect(badge.description).toBeDefined();
        expect(badge.criteria).toBeDefined();
        expect(badge.icon).toBeDefined();
        expect(typeof badge.points).toBe("number");
      }
    });
  });

  describe("GET /api/gamification/user-achievements", () => {
    test("Get user achievements with authentication", async () => {
      const res = await authenticatedApi("/api/gamification/user-achievements", authToken);
      await expectStatus(res, 200);

      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      if (data.length > 0) {
        const achievement = data[0];
        expect(achievement.id).toBeDefined();
        expect(achievement.badgeName).toBeDefined();
        expect(achievement.dateUnlocked).toBeDefined();
        expect(typeof achievement.points).toBe("number");
      }
    });
  });

  describe("GET /api/gamification/user-points", () => {
    test("Get user points and stats with authentication", async () => {
      const res = await authenticatedApi("/api/gamification/user-points", authToken);
      await expectStatus(res, 200);

      const data = await res.json();
      expect(typeof data.totalPoints).toBe("number");
      expect(typeof data.loginStreak).toBe("number");
      expect(typeof data.machinesReported).toBe("number");
      expect(typeof data.casinosScouted).toBe("number");
      expect(data.lastLoginDate === null || typeof data.lastLoginDate === "string").toBe(true);
    });
  });

  describe("POST /api/gamification/award-points", () => {
    test("Award points for machine_report action", async () => {
      const res = await authenticatedApi("/api/gamification/award-points", authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "machine_report",
          metadata: {
            hasPhoto: true,
            casinoName: "Test Casino",
          },
        }),
      });
      await expectStatus(res, 200);

      const data = await res.json();
      expect(typeof data.pointsAwarded).toBe("number");
      expect(Array.isArray(data.newBadges)).toBe(true);
      expect(typeof data.totalPoints).toBe("number");
    });

    test("Award points for daily_login action", async () => {
      const res = await authenticatedApi("/api/gamification/award-points", authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "daily_login",
        }),
      });
      await expectStatus(res, 200);

      const data = await res.json();
      expect(typeof data.pointsAwarded).toBe("number");
      expect(typeof data.totalPoints).toBe("number");
    });

    test("Award points for big_win action", async () => {
      const res = await authenticatedApi("/api/gamification/award-points", authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "big_win",
          metadata: {
            winAmount: 5000.50,
          },
        }),
      });
      await expectStatus(res, 200);

      const data = await res.json();
      expect(typeof data.pointsAwarded).toBe("number");
    });

    test("Reject points award without action", async () => {
      const res = await authenticatedApi("/api/gamification/award-points", authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metadata: { test: "value" },
        }),
      });
      await expectStatus(res, 400);
    });
  });

  describe("GET /api/gamification/leaderboards/{type}", () => {
    test("Get highest_win leaderboard", async () => {
      const res = await api("/api/gamification/leaderboards/highest_win");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.leaderboard).toBeDefined();
      expect(Array.isArray(data.leaderboard)).toBe(true);
      expect(data.month).toBeDefined();
      expect(data.disclaimer).toBeDefined();
      if (data.leaderboard.length > 0) {
        const entry = data.leaderboard[0];
        expect(entry.userId).toBeDefined();
        expect(entry.username).toBeDefined();
        expect(typeof entry.score).toBe("number");
        expect(typeof entry.rank).toBe("number");
      }
    });

    test("Get machines_reported leaderboard", async () => {
      const res = await api("/api/gamification/leaderboards/machines_reported");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.leaderboard).toBeDefined();
      expect(Array.isArray(data.leaderboard)).toBe(true);
      expect(data.month).toBeDefined();
    });

    test("Get casinos_scouted leaderboard", async () => {
      const res = await api("/api/gamification/leaderboards/casinos_scouted");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.leaderboard).toBeDefined();
      expect(Array.isArray(data.leaderboard)).toBe(true);
      expect(data.month).toBeDefined();
    });
  });

  describe("POST /api/gamification/update-leaderboard", () => {
    test("Update leaderboard for highest_win", async () => {
      const res = await authenticatedApi("/api/gamification/update-leaderboard", authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "highest_win",
          value: 10000.50,
          photoProofUrl: "https://example.com/proof.jpg",
        }),
      });
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.userId).toBeDefined();
      expect(data.username).toBeDefined();
      expect(typeof data.score).toBe("number");
      expect(typeof data.rank).toBe("number");
    });

    test("Update leaderboard for machines_reported", async () => {
      const res = await authenticatedApi("/api/gamification/update-leaderboard", authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "machines_reported",
          value: 15,
        }),
      });
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.userId).toBeDefined();
      expect(typeof data.score).toBe("number");
    });

    test("Update leaderboard for casinos_scouted", async () => {
      const res = await authenticatedApi("/api/gamification/update-leaderboard", authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "casinos_scouted",
          value: 5,
        }),
      });
      await expectStatus(res, 200);

      const data = await res.json();
      expect(typeof data.score).toBe("number");
    });

    test("Reject leaderboard update without type", async () => {
      const res = await authenticatedApi("/api/gamification/update-leaderboard", authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value: 100,
        }),
      });
      await expectStatus(res, 400);
    });

    test("Reject leaderboard update without value", async () => {
      const res = await authenticatedApi("/api/gamification/update-leaderboard", authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "highest_win",
        }),
      });
      await expectStatus(res, 400);
    });
  });

  // ============================================================================
  // Community Reports (CRUD)
  // ============================================================================

  describe("Community Reports CRUD", () => {
    test("Create community report", async () => {
      const res = await api("/api/community-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: "https://example.com/win1.jpg",
          casino: "Bellagio",
          manufacturer: "IGT",
          gameTitle: "Double Diamond",
          winAmount: 1500.50,
          jackpotType: "Line Hit",
          notes: "Great experience",
        }),
      });
      await expectStatus(res, 201);

      const data = await res.json();
      expect(data.id).toBeDefined();
      expect(typeof data.id).toBe("string");
      expect(data.imageUrl).toBe("https://example.com/win1.jpg");
      expect(data.casino).toBe("Bellagio");
      expect(data.manufacturer).toBe("IGT");
      expect(data.gameTitle).toBe("Double Diamond");
      expect(data.createdAt).toBeDefined();
      expect(data.disclaimer).toBeDefined();
      communityReportId = data.id;
    });

    test("Create community report with minimal fields", async () => {
      const res = await api("/api/community-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: "https://example.com/win2.jpg",
          casino: "Caesars Palace",
        }),
      });
      await expectStatus(res, 201);

      const data = await res.json();
      expect(data.id).toBeDefined();
      expect(data.casino).toBe("Caesars Palace");
      expect(data.createdAt).toBeDefined();
      expect(data.manufacturer === null || typeof data.manufacturer === "string").toBe(true);
      expect(data.gameTitle === null || typeof data.gameTitle === "string").toBe(true);
      expect(data.notes === null || typeof data.notes === "string").toBe(true);
    });

    test("Reject community report without imageUrl", async () => {
      const res = await api("/api/community-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          casino: "MGM Grand",
        }),
      });
      await expectStatus(res, 400);

      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    test("Reject community report without casino", async () => {
      const res = await api("/api/community-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: "https://example.com/win3.jpg",
        }),
      });
      await expectStatus(res, 400);

      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    test("List all community reports", async () => {
      const res = await api("/api/community-reports");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      if (data.length > 0) {
        const report = data[0];
        expect(report.id).toBeDefined();
        expect(report.imageUrl).toBeDefined();
        expect(report.casino).toBeDefined();
        expect(report.createdAt).toBeDefined();
      }
    });

    test("List community reports with manufacturer filter", async () => {
      const res = await api("/api/community-reports?manufacturer=IGT");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });

    test("List community reports with gameTitle filter", async () => {
      const res = await api("/api/community-reports?gameTitle=Double%20Diamond");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });

    test("List community reports with casino filter", async () => {
      const res = await api("/api/community-reports?casino=Bellagio");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });

    test("List community reports with limit parameter", async () => {
      const res = await api("/api/community-reports?limit=5");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length <= 5).toBe(true);
    });
  });

  describe("DELETE /api/community-reports/{id}", () => {
    test("Delete a community report", async () => {
      const createRes = await api("/api/community-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: "https://example.com/delete-report.jpg",
          casino: "Delete Test Casino",
          notes: "This report will be deleted",
        }),
      });
      await expectStatus(createRes, 201);
      const createdData = await createRes.json();
      const deleteId = createdData.id;

      const deleteRes = await api(`/api/community-reports/${deleteId}`, {
        method: "DELETE",
      });
      await expectStatus(deleteRes, 200);

      const data = await deleteRes.json();
      expect(data.success).toBe(true);
    });

    test("Return 404 when deleting non-existent community report", async () => {
      const res = await api("/api/community-reports/00000000-0000-0000-0000-000000000000", {
        method: "DELETE",
      });
      await expectStatus(res, 404);

      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  // ============================================================================
  // Recent Wins
  // ============================================================================

  describe("GET /api/community-reports/recent-wins", () => {
    test("Get recent big wins", async () => {
      const res = await api("/api/community-reports/recent-wins");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length <= 10).toBe(true);
      if (data.length > 0) {
        const win = data[0];
        expect(win.id).toBeDefined();
        expect(win.imageUrl).toBeDefined();
        expect(win.casino).toBeDefined();
        expect(win.createdAt).toBeDefined();
      }
    });

    test("Get recent wins filtered by manufacturer", async () => {
      const res = await api("/api/community-reports/recent-wins?manufacturer=IGT");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });

    test("Get recent wins filtered by gameTitle", async () => {
      const res = await api("/api/community-reports/recent-wins?gameTitle=Double%20Diamond");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });

    test("Get recent wins with custom limit", async () => {
      const res = await api("/api/community-reports/recent-wins?limit=3");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length <= 3).toBe(true);
    });

    test("Get recent wins with limit=0", async () => {
      const res = await api("/api/community-reports/recent-wins?limit=0");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe("GET /api/community-reports/by-casino/{casinoName}", () => {
    test("Get community reports for a specific casino", async () => {
      const res = await api("/api/community-reports/by-casino/Bellagio");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.reports).toBeDefined();
      expect(Array.isArray(data.reports)).toBe(true);
      expect(typeof data.count).toBe("number");
      if (data.reports.length > 0) {
        const report = data.reports[0];
        expect(report.id).toBeDefined();
        expect(report.imageUrl).toBeDefined();
        expect(report.casino).toBe("Bellagio");
        expect(report.createdAt).toBeDefined();
      }
    });

    test("Get community reports with limit parameter", async () => {
      const res = await api("/api/community-reports/by-casino/Caesars%20Palace?limit=3");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.reports).toBeDefined();
      expect(Array.isArray(data.reports)).toBe(true);
      expect(data.reports.length <= 3).toBe(true);
    });
  });

  // ============================================================================
  // Casino Directory - Casinos
  // ============================================================================

  describe("GET /api/casino-directory/casinos", () => {
    test("Get all casinos with reported machine counts", async () => {
      const res = await api("/api/casino-directory/casinos");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.casinos).toBeDefined();
      expect(Array.isArray(data.casinos)).toBe(true);
      expect(data.disclaimer).toBeDefined();
      if (data.casinos.length > 0) {
        const casino = data.casinos[0];
        expect(casino.id).toBeDefined();
        expect(casino.name).toBeDefined();
        expect(typeof casino.reportedCount).toBe("number");
      }
    });
  });

  // ============================================================================
  // Casino Directory - Machines
  // ============================================================================

  describe("POST /api/casino-directory/report-machine", () => {
    test("Report a machine sighting at a casino successfully", async () => {
      const res = await api("/api/casino-directory/report-machine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          casinoName: "Report Machine Casino",
          brand: "Aristocrat",
          gameTitle: "Queen of the Nile",
          denom: "1¢",
          photoUrl: "https://example.com/photo.jpg",
          notes: "Saw this machine today",
          lastSeen: "2026-02-19",
        }),
      });
      await expectStatus(res, 201);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.machine).toBeDefined();
      expect(data.machine.id).toBeDefined();
      expect(data.machine.casinoName).toBe("Report Machine Casino");
      expect(data.machine.brand).toBe("Aristocrat");
      expect(data.machine.gameTitle).toBe("Queen of the Nile");
      expect(data.machine.denom).toBe("1¢");
      expect(data.machine.lastSeen).toBeDefined();
      expect(data.machine.createdAt).toBeDefined();
      expect(data.casino).toBeDefined();
      expect(data.casino.id).toBeDefined();
      expect(data.casino.name).toBe("Report Machine Casino");
      expect(typeof data.casino.reportedCount).toBe("number");
    });

    test("Report machine with minimal required fields", async () => {
      const res = await api("/api/casino-directory/report-machine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          casinoName: "Minimal Report Casino",
          brand: "IGT",
          gameTitle: "Wolf Run",
          denom: "25¢",
        }),
      });
      await expectStatus(res, 201);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.machine).toBeDefined();
      expect(data.machine.casinoName).toBe("Minimal Report Casino");
    });

    test("Reject report without casinoName", async () => {
      const res = await api("/api/casino-directory/report-machine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: "IGT",
          gameTitle: "Game",
          denom: "25¢",
        }),
      });
      await expectStatus(res, 400);
    });

    test("Reject report without brand", async () => {
      const res = await api("/api/casino-directory/report-machine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          casinoName: "Casino",
          gameTitle: "Game",
          denom: "25¢",
        }),
      });
      await expectStatus(res, 400);
    });

    test("Reject report without gameTitle", async () => {
      const res = await api("/api/casino-directory/report-machine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          casinoName: "Casino",
          brand: "IGT",
          denom: "25¢",
        }),
      });
      await expectStatus(res, 400);
    });

    test("Reject report without denom", async () => {
      const res = await api("/api/casino-directory/report-machine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          casinoName: "Casino",
          brand: "IGT",
          gameTitle: "Game",
        }),
      });
      await expectStatus(res, 400);
    });
  });

  describe("POST /api/casino-directory/machines", () => {
    test("Add a new machine sighting successfully", async () => {
      const res = await api("/api/casino-directory/machines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          casino_name: "Test Casino",
          brand: "IGT",
          game_title: "Double Diamond",
          denom: "25¢",
          photo_url: "https://example.com/photo.jpg",
          notes: "Test sighting",
        }),
      });
      await expectStatus(res, 201);

      const data = await res.json();
      expect(data.id).toBeDefined();
      expect(typeof data.id).toBe("string");
      expect(data.casinoName).toBe("Test Casino");
      expect(data.brand).toBe("IGT");
      expect(data.gameTitle).toBe("Double Diamond");
      expect(data.denom).toBe("25¢");
      expect(data.lastSeen).toBeDefined();
      expect(data.createdAt).toBeDefined();
      casinoDirectoryMachineId = data.id;
    });

    test("Add machine sighting with minimal required fields", async () => {
      const res = await api("/api/casino-directory/machines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          casino_name: "Minimal Casino",
          brand: "WMS",
          game_title: "Reel Game",
          denom: "5¢",
        }),
      });
      await expectStatus(res, 201);

      const data = await res.json();
      expect(data.id).toBeDefined();
      expect(data.casinoName).toBe("Minimal Casino");
    });

    test("Reject machine sighting without casino_name", async () => {
      const res = await api("/api/casino-directory/machines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: "IGT",
          game_title: "Game",
          denom: "25¢",
        }),
      });
      await expectStatus(res, 400);
    });

    test("Reject machine sighting without brand", async () => {
      const res = await api("/api/casino-directory/machines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          casino_name: "Casino",
          game_title: "Game",
          denom: "25¢",
        }),
      });
      await expectStatus(res, 400);
    });

    test("Reject machine sighting without game_title", async () => {
      const res = await api("/api/casino-directory/machines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          casino_name: "Casino",
          brand: "IGT",
          denom: "25¢",
        }),
      });
      await expectStatus(res, 400);
    });

    test("Reject machine sighting without denom", async () => {
      const res = await api("/api/casino-directory/machines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          casino_name: "Casino",
          brand: "IGT",
          game_title: "Game",
        }),
      });
      await expectStatus(res, 400);
    });
  });

  describe("GET /api/casino-directory/casinos/{casinoName}/machines", () => {
    test("Get all machines reported at a specific casino", async () => {
      const res = await api("/api/casino-directory/casinos/Test%20Casino/machines");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.machines).toBeDefined();
      expect(Array.isArray(data.machines)).toBe(true);
      expect(data.disclaimer).toBeDefined();
      if (data.machines.length > 0) {
        const machine = data.machines[0];
        expect(machine.id).toBeDefined();
        expect(machine.casinoName).toBeDefined();
        expect(machine.brand).toBeDefined();
        expect(machine.gameTitle).toBeDefined();
        expect(machine.denom).toBeDefined();
        expect(machine.lastSeen).toBeDefined();
        expect(machine.createdAt).toBeDefined();
      }
    });
  });

  describe("GET /api/casino-directory/machines/search", () => {
    test("Search machines without query parameter", async () => {
      const res = await api("/api/casino-directory/machines/search");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.machines).toBeDefined();
      expect(Array.isArray(data.machines)).toBe(true);
      expect(data.disclaimer).toBeDefined();
    });

    test("Search machines by query", async () => {
      const res = await api("/api/casino-directory/machines/search?query=Diamond");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.machines).toBeDefined();
      expect(Array.isArray(data.machines)).toBe(true);
      if (data.machines.length > 0) {
        const machine = data.machines[0];
        expect(machine.id).toBeDefined();
        expect(machine.casinoName).toBeDefined();
        expect(machine.brand).toBeDefined();
        expect(machine.gameTitle).toBeDefined();
      }
    });
  });

  describe("GET /api/casino-directory/machines/by-game/{gameTitle}", () => {
    test("Get all casinos where a specific game has been reported", async () => {
      const res = await api("/api/casino-directory/machines/by-game/Double%20Diamond");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.casinos).toBeDefined();
      expect(Array.isArray(data.casinos)).toBe(true);
      expect(data.disclaimer).toBeDefined();
      if (data.casinos.length > 0) {
        const casino = data.casinos[0];
        expect(casino.casinoName).toBeDefined();
        expect(casino.brand).toBeDefined();
        expect(casino.denom).toBeDefined();
        expect(casino.lastSeen).toBeDefined();
        expect(typeof casino.count).toBe("number");
      }
    });
  });

  describe("POST /api/casino-directory/machines/{id}/saw-this", () => {
    test("Report seeing a machine again - updates last_seen", async () => {
      if (!casinoDirectoryMachineId) {
        const createRes = await api("/api/casino-directory/machines", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            casino_name: "Saw This Casino",
            brand: "IGT",
            game_title: "Test Game",
            denom: "25¢",
          }),
        });
        await expectStatus(createRes, 201);
        const createdData = await createRes.json();
        casinoDirectoryMachineId = createdData.id;
      }

      const res = await api(`/api/casino-directory/machines/${casinoDirectoryMachineId}/saw-this`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "550e8400-e29b-41d4-a716-446655440000",
        }),
      });
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.machine).toBeDefined();
      expect(data.machine.id).toBeDefined();
      expect(data.machine.casinoName).toBeDefined();
      expect(data.machine.lastSeen).toBeDefined();
    });

    test("Report seeing machine without userId", async () => {
      if (!casinoDirectoryMachineId) {
        return;
      }

      const res = await api(`/api/casino-directory/machines/${casinoDirectoryMachineId}/saw-this`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.success).toBe(true);
    });

    test("Return 404 when reporting on non-existent machine", async () => {
      const res = await api("/api/casino-directory/machines/00000000-0000-0000-0000-000000000000/saw-this", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      await expectStatus(res, 404);

      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  describe("PUT /api/casino-directory/machines/{id}", () => {
    test("Update machine details", async () => {
      if (!casinoDirectoryMachineId) {
        return;
      }

      const res = await api(`/api/casino-directory/machines/${casinoDirectoryMachineId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: "Updated Brand",
          game_title: "Updated Game",
          denom: "50¢",
          notes: "Updated notes",
        }),
      });
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.id).toBe(casinoDirectoryMachineId);
      expect(data.brand).toBe("Updated Brand");
      expect(data.gameTitle).toBe("Updated Game");
      expect(data.denom).toBe("50¢");
    });

    test("Return 404 when updating non-existent machine", async () => {
      const res = await api("/api/casino-directory/machines/00000000-0000-0000-0000-000000000000", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: "Updated",
        }),
      });
      await expectStatus(res, 404);

      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  describe("DELETE /api/casino-directory/machines/{id}", () => {
    test("Delete a machine entry", async () => {
      const createRes = await api("/api/casino-directory/machines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          casino_name: "Delete Test Casino",
          brand: "IGT",
          game_title: "Delete Game",
          denom: "25¢",
        }),
      });
      await expectStatus(createRes, 201);
      const createdData = await createRes.json();
      const deleteId = createdData.id;

      const deleteRes = await api(`/api/casino-directory/machines/${deleteId}`, {
        method: "DELETE",
      });
      await expectStatus(deleteRes, 200);

      const data = await deleteRes.json();
      expect(data.success).toBe(true);
    });

    test("Return 404 when deleting non-existent machine", async () => {
      const res = await api("/api/casino-directory/machines/00000000-0000-0000-0000-000000000000", {
        method: "DELETE",
      });
      await expectStatus(res, 404);

      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  // ============================================================================
  // Casino Directory - Activity Stats
  // ============================================================================

  describe("GET /api/casino-directory/activity-stats", () => {
    test("Get aggregated sighting statistics per casino", async () => {
      const res = await api("/api/casino-directory/activity-stats");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.stats).toBeDefined();
      expect(Array.isArray(data.stats)).toBe(true);
      expect(data.disclaimer).toBeDefined();
      if (data.stats.length > 0) {
        const stat = data.stats[0];
        expect(stat.casinoName).toBeDefined();
        expect(typeof stat.totalWinAmount).toBe("number");
        expect(typeof stat.reportCount).toBe("number");
      }
    });
  });

  // ============================================================================
  // Casino Directory - Bulk Insert
  // ============================================================================

  describe("POST /api/casino-directory/bulk-insert-aristocrat", () => {
    test("Bulk insert Aristocrat games successfully", async () => {
      const res = await api("/api/casino-directory/bulk-insert-aristocrat", {
        method: "POST",
      });
      await expectStatus(res, 201);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(typeof data.inserted).toBe("number");
      expect(typeof data.casinos).toBe("number");
      expect(data.message).toBeDefined();
    });
  });

  describe("POST /api/casino-directory/bulk-insert-non-aristocrat", () => {
    test("Bulk insert non-Aristocrat games successfully", async () => {
      const res = await api("/api/casino-directory/bulk-insert-non-aristocrat", {
        method: "POST",
      });
      await expectStatus(res, 201);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(typeof data.machinesAdded).toBe("number");
      expect(typeof data.casinosUpdated).toBe("number");
      expect(data.message).toBeDefined();
    });
  });

  // ============================================================================
  // Maintenance
  // ============================================================================

  describe("POST /api/maintenance/cleanup-cache", () => {
    test("Clean up slot recognition cache entries", async () => {
      const res = await api("/api/maintenance/cleanup-cache", {
        method: "POST",
      });
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(typeof data.deletedCount).toBe("number");
    });
  });

  // ============================================================================
  // Map Endpoints
  // ============================================================================

  describe("GET /api/map/machines", () => {
    test("Get all reported machines with location data for map display", async () => {
      const res = await api("/api/map/machines");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.machines).toBeDefined();
      expect(Array.isArray(data.machines)).toBe(true);
      expect(data.disclaimer).toBeDefined();
      if (data.machines.length > 0) {
        const machine = data.machines[0];
        expect(machine.id).toBeDefined();
        expect(machine.casinoName).toBeDefined();
        expect(machine.brand).toBeDefined();
        expect(machine.gameTitle).toBeDefined();
        expect(machine.denom).toBeDefined();
        expect(typeof machine.latitude).toBe("number");
        expect(typeof machine.longitude).toBe("number");
        expect(machine.lastSeen).toBeDefined();
      }
    });
  });

  describe("GET /api/map/machines/recent", () => {
    test("Get machines reported in the last N days", async () => {
      const res = await api("/api/map/machines/recent");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.machines).toBeDefined();
      expect(Array.isArray(data.machines)).toBe(true);
      expect(data.disclaimer).toBeDefined();
      if (data.machines.length > 0) {
        const machine = data.machines[0];
        expect(machine.id).toBeDefined();
        expect(machine.casinoName).toBeDefined();
        expect(machine.brand).toBeDefined();
        expect(machine.gameTitle).toBeDefined();
        expect(machine.denom).toBeDefined();
        expect(typeof machine.latitude).toBe("number");
        expect(typeof machine.longitude).toBe("number");
        expect(machine.lastSeen).toBeDefined();
      }
    });

    test("Get machines with custom days parameter", async () => {
      const res = await api("/api/map/machines/recent?days=7");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.machines).toBeDefined();
      expect(Array.isArray(data.machines)).toBe(true);
      expect(data.disclaimer).toBeDefined();
    });

    test("Get machines with days=0", async () => {
      const res = await api("/api/map/machines/recent?days=0");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.machines).toBeDefined();
      expect(Array.isArray(data.machines)).toBe(true);
    });
  });

  describe("GET /api/map/casinos", () => {
    test("Get all casinos with their coordinates for map markers", async () => {
      const res = await api("/api/map/casinos");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.casinos).toBeDefined();
      expect(Array.isArray(data.casinos)).toBe(true);
      if (data.casinos.length > 0) {
        const casino = data.casinos[0];
        expect(casino.id).toBeDefined();
        expect(casino.name).toBeDefined();
        expect(typeof casino.latitude).toBe("number");
        expect(typeof casino.longitude).toBe("number");
        expect(typeof casino.reportedCount).toBe("number");
      }
    });
  });

  // ============================================================================
  // Purchases - Trip Pass
  // ============================================================================

  describe("POST /api/purchases/trip-pass", () => {
    test("Create a trip pass purchase", async () => {
      const { user } = await signUpTestUser();

      const res = await api("/api/purchases/trip-pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          productId: "com.slotscout.trippass",
          price: 6.99,
          platform: "web",
        }),
      });
      await expectStatus(res, 201);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.purchaseId).toBeDefined();
      expect(data.activatedAt).toBeDefined();
      expect(data.isTripPassActive).toBe(true);
    });
  });

  describe("GET /api/purchases/restore", () => {
    test("Restore trip pass status for user with active purchase", async () => {
      const { token, user } = await signUpTestUser();

      // Create a purchase
      const purchaseRes = await api("/api/purchases/trip-pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          productId: "com.slotscout.trippass",
          price: 6.99,
        }),
      });
      await expectStatus(purchaseRes, 201);

      // Check restore endpoint
      const res = await authenticatedApi("/api/purchases/restore", token);
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.hasTripPass).toBe(true);
      expect(data.purchaseDate).toBeDefined();
      expect(data.productId).toBe("com.slotscout.trippass");
    });

    test("Restore trip pass status for user without purchase", async () => {
      const { token } = await signUpTestUser();

      const res = await authenticatedApi("/api/purchases/restore", token);
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.hasTripPass).toBe(false);
      expect(data.purchaseDate).toBeNull();
      expect(data.productId).toBeNull();
    });

    test("Return 401 when not authenticated", async () => {
      const res = await api("/api/purchases/restore");
      await expectStatus(res, 401);
    });
  });

  describe("GET /api/purchases/status", () => {
    test("Get trip pass status for user", async () => {
      const { token, user } = await signUpTestUser();

      const res = await authenticatedApi("/api/purchases/status", token);
      await expectStatus(res, 200);

      const data = await res.json();
      expect(typeof data.isTripPassActive).toBe("boolean");
      expect(data.purchaseDate === null || typeof data.purchaseDate === "string").toBe(true);
    });

    test("Return 401 when not authenticated", async () => {
      const res = await api("/api/purchases/status");
      await expectStatus(res, 401);
    });
  });

  // ============================================================================
  // Admin - Data Updates
  // ============================================================================

  describe("POST /api/admin/ngcb-stats/update", () => {
    test("Update NGCB stats (admin only)", async () => {
      const { token } = await signUpTestUser();

      const res = await authenticatedApi("/api/admin/ngcb-stats/update", token, {
        method: "POST",
      });
      // Admin-only endpoint - expect 403 for regular user
      await expectStatus(res, 403);

      const data = await res.json();
      expect(data.error).toBe("Admin access required");
    });
  });

  describe("POST /api/admin/jackpots/update", () => {
    test("Update jackpots (admin only)", async () => {
      const { token } = await signUpTestUser();

      const res = await authenticatedApi("/api/admin/jackpots/update", token, {
        method: "POST",
      });
      // Admin-only endpoint - expect 403 for regular user
      await expectStatus(res, 403);
    });
  });

  describe("POST /api/admin/run-all-updates", () => {
    test("Run all updates (admin only)", async () => {
      const { token } = await signUpTestUser();

      const res = await authenticatedApi("/api/admin/run-all-updates", token, {
        method: "POST",
      });
      // Admin-only endpoint - expect 403 for regular user
      await expectStatus(res, 403);
    });
  });

  describe("GET /api/admin/last-updated", () => {
    test("Get last updated timestamps (admin only)", async () => {
      const { token } = await signUpTestUser();

      const res = await authenticatedApi("/api/admin/last-updated", token);
      // Admin-only endpoint - expect 403 for regular user
      await expectStatus(res, 403);
    });
  });

  describe("GET /api/public/last-updated", () => {
    test("Get last updated timestamps (public endpoint)", async () => {
      const res = await api("/api/public/last-updated");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.ngcbStats === null || typeof data.ngcbStats === "string").toBe(true);
      expect(data.jackpots === null || typeof data.jackpots === "string").toBe(true);
      expect(data.parSheets === null || typeof data.parSheets === "string").toBe(true);
      expect(data.disclaimer).toBeDefined();
    });
  });

  // ============================================================================
  // Admin PIN Authentication
  // ============================================================================

  describe("POST /api/admin/auth/login", () => {
    test("Login with correct PIN", async () => {
      const res = await api("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: "4242" }),
      });
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.adminToken).toBeDefined();
      expect(typeof data.expiresIn).toBe("number");
      expect(data.message).toBeDefined();
    });

    test("Reject invalid PIN", async () => {
      const res = await api("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: "9999" }),
      });
      await expectStatus(res, 401);

      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  describe("POST /api/admin/auth/logout", () => {
    test("Logout admin session", async () => {
      // First login
      const loginRes = await api("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: "4242" }),
      });
      await expectStatus(loginRes, 200);
      const { adminToken } = await loginRes.json();

      // Then logout
      const logoutRes = await api("/api/admin/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminToken }),
      });
      await expectStatus(logoutRes, 200);

      const data = await logoutRes.json();
      expect(data.success).toBe(true);
      expect(data.message).toBeDefined();
    });
  });

  describe("Admin Token Authentication", () => {
    test("GET /api/admin/last-updated works with admin token header", async () => {
      // First login to get admin token
      const loginRes = await api("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: "4242" }),
      });
      await expectStatus(loginRes, 200);
      const { adminToken } = await loginRes.json();

      // Use admin token to access protected endpoint
      const res = await adminTokenApi("/api/admin/last-updated", adminToken);
      await expectStatus(res, 200);

      const data = await res.json();
      // Each field should be either a string (ISO date) or null
      expect(data.ngcbStats === null || typeof data.ngcbStats === "string").toBe(true);
      expect(data.jackpots === null || typeof data.jackpots === "string").toBe(true);
      expect(data.parSheets === null || typeof data.parSheets === "string").toBe(true);
      expect(data.ngcbUnlvTrends === null || typeof data.ngcbUnlvTrends === "string").toBe(true);
      expect(data.disclaimer).toBeDefined();
    });

    test("POST /api/admin/ngcb-stats/update works with admin token header", async () => {
      // First login to get admin token
      const loginRes = await api("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: "4242" }),
      });
      await expectStatus(loginRes, 200);
      const { adminToken } = await loginRes.json();

      // Use admin token to access protected endpoint
      const res = await adminTokenApi("/api/admin/ngcb-stats/update", adminToken, {
        method: "POST",
      });
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(typeof data.recordsUpdated).toBe("number");
      expect(data.lastUpdated).toBeDefined();
    });

    test("POST /api/admin/ngcb-unlv/update works with admin token header", async () => {
      // First login to get admin token
      const loginRes = await api("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: "4242" }),
      });
      await expectStatus(loginRes, 200);
      const { adminToken } = await loginRes.json();

      // Use admin token to access protected endpoint
      const res = await adminTokenApi("/api/admin/ngcb-unlv/update", adminToken, {
        method: "POST",
      });
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(typeof data.recordsUpdated).toBe("number");
      expect(data.timestamp).toBeDefined();
    });

    test("Reject expired admin token", async () => {
      // Use a clearly invalid token that won't exist in sessions
      const fakeToken = Buffer.from("admin_0_0").toString("base64");

      const res = await adminTokenApi("/api/admin/last-updated", fakeToken);
      await expectStatus(res, 401);

      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  // ============================================================================
  // NGCB/UNLV Trends
  // ============================================================================

  describe("GET /api/ngcb-unlv/trends/latest", () => {
    test("Get latest NGCB/UNLV trends (public endpoint)", async () => {
      const res = await api("/api/ngcb-unlv/trends/latest");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(data.trends).toBeDefined();
      expect(Array.isArray(data.trends)).toBe(true);
      expect(data.disclaimer).toBeDefined();
      expect(data.source === "database" || data.source === "fallback").toBe(true);

      if (data.trends.length > 0) {
        const trend = data.trends[0];
        expect(trend.reportMonth).toBeDefined();
        expect(trend.locationArea).toBeDefined();
        expect(trend.holdPercent).toBeDefined();
        expect(trend.rtpPercent).toBeDefined();
      }
    });
  });

  describe("POST /api/admin/ngcb-unlv/update", () => {
    test("Update NGCB/UNLV trends (admin only)", async () => {
      const { token } = await signUpTestUser();

      const res = await authenticatedApi("/api/admin/ngcb-unlv/update", token, {
        method: "POST",
      });
      // Admin-only endpoint - expect 403 for regular user
      await expectStatus(res, 403);
    });
  });

  describe("GET /api/analytics/summary", () => {
    test("Get analytics summary", async () => {
      const res = await api("/api/analytics/summary");
      await expectStatus(res, 200);

      const data = await res.json();
      expect(typeof data.totalCommunityReports).toBe("number");
      expect(typeof data.totalCasinoMachines).toBe("number");
      expect(typeof data.activeCasinos).toBe("number");
    });
  });
});
