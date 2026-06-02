/** Customer session helper — disabled while guest booking is used */
export async function getCustomerSession() {
  return null;

  /* Re-enable:
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "USER") {
    return null;
  }
  return session;
  */
}
