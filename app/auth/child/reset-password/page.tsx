import { Suspense } from "react";
import { ChildResetPassword } from "../../childResetPassword";

export default function Page() {
  return (
    <Suspense>
      <ChildResetPassword />
    </Suspense>
  );
}
