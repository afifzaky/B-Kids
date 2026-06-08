import { Suspense } from "react";
import { ParentResetPassword } from "../../parentResetPassword";

export default function Page() {
  return (
    <Suspense>
      <ParentResetPassword />
    </Suspense>
  );
}
