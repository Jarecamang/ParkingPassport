const AppFooter = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="mt-12 text-center text-sm text-secondary">
      <p>© {currentYear} Building Parking Manager. All rights reserved.</p>
      <p className="mt-1">Contact building administration for support.</p>
    </footer>
  );
};

export default AppFooter;
