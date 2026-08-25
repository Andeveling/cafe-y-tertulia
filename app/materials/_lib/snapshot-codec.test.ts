import { describe, expect, it } from "vitest";
import {
	decodeSnapshot,
	jArray,
	jBool,
	jNullString,
	jNumber,
	jString,
} from "./snapshot-codec";

describe("SnapshotCodec primitives", () => {
	it("jString acepta string y cae a '' con otros tipos", () => {
		expect(jString.parse("hola")).toBe("hola");
		expect(jString.parse(42)).toBe("");
		expect(jString.parse(null)).toBe("");
		expect(jString.parse(undefined)).toBe("");
	});

	it("jNullString acepta string, null y cae a null", () => {
		expect(jNullString.parse("x")).toBe("x");
		expect(jNullString.parse(null)).toBe(null);
		expect(jNullString.parse(42)).toBe(null);
	});

	it("jNumber acepta number y cae a 0", () => {
		expect(jNumber.parse(5)).toBe(5);
		expect(jNumber.parse("5")).toBe(0);
		expect(jNumber.parse(null)).toBe(0);
	});

	it("jBool acepta boolean y cae a false", () => {
		expect(jBool.parse(true)).toBe(true);
		expect(jBool.parse("true")).toBe(false);
	});

	it("jArray acepta array tipado y cae a []", () => {
		const schema = jArray(jString);
		expect(schema.parse(["a", "b"])).toEqual(["a", "b"]);
		expect(schema.parse("no-array")).toEqual([]);
		expect(schema.parse(null)).toEqual([]);
	});
});

describe("decodeSnapshot", () => {
	it("devuelve null para Json no-objeto", () => {
		expect(decodeSnapshot(null, jString)).toBeNull();
		expect(decodeSnapshot("str" as unknown as never, jString)).toBeNull();
		expect(decodeSnapshot([] as unknown as never, jString)).toBeNull();
	});

	it("parsea objeto válido con schema", () => {
		// decodeSnapshot espera un objeto Json; si el schema espera string
		// y recibe objeto, .catch("") lo maneja
		const obj = { name: "Ana" };
		expect(decodeSnapshot(obj as never, jString)).toBe("");
	});
});
