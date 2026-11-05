"use client";

export default function FeatureError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="card border-danger p-6">
      <h2 className="text-lg font-bold">That change wasn't saved</h2>
      <p className="mt-1 text-sm text-muted">{error.message || "Something went wrong while saving."} Check the form and try again.</p>
      <button type="button" className="btn mt-4" onClick={reset}>Back to the form</button>
    </div>
  );
}
