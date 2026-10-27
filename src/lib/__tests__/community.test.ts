import { describe, expect, it } from "vitest";
import { communityContentIssue } from "@/lib/community";

describe("community content checks", () => {
  it("allows ordinary parent conversation", () => {
    expect(communityContentIssue("What soft textures worked for your family this week?")).toBeNull();
  });

  it("blocks link-heavy spam", () => {
    expect(communityContentIssue("https://a.test https://b.test https://c.test https://d.test")).toBe(
      "Please remove excess links.",
    );
  });

  it("blocks unsafe promotional claims", () => {
    expect(communityContentIssue("This is a guaranteed cure for everything.")).toBeTruthy();
  });
});
