import PresentClient from "./PresentClient";

// Static export: build a single placeholder page; public/_redirects serves
// it for every real quiz id, which the client reads from the URL.
export const dynamicParams = false;
export function generateStaticParams() {
  return [{ quizId: "_" }];
}

export default function Page() {
  return <PresentClient />;
}
