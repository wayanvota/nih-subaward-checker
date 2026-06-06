import "./styles.css";

export const metadata = {
  title: "NIH Subaward Prior-Approval Checker",
  description: "Decision-support tool for NOT-OD-26-062 domestic subaward prior approval."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
