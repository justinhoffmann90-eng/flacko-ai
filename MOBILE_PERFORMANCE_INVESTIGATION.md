# Mobile Performance Investigation & Fixes
**Date:** February 11, 2025  
**Issue:** Dashboard feels laggy on mobile, especially when navigating from Orb page back to dashboard

## Investigation Summary

### Already Implemented (Previous Work)
The following optimizations were already in place from previous commits:

✅ **Loading Skeletons**
- `app/(dashboard)/dashboard/loading.tsx` - Dashboard page skeleton
- `app/orb/loading.tsx` - Orb page skeleton
- Both provide instant visual feedback during page transitions

✅ **Lazy Loading**
- OrbClient component (1171 lines) lazy-loaded with `next/dynamic`, SSR disabled
- LivePriceLadder component lazy-loaded with skeleton
- PositioningCard component lazy-loaded with skeleton  
- OrbSignalsCard component lazy-loaded (client-only)
- All lazy-loaded components have inline loading states

✅ **Proper Cleanup**
- OrbClient properly cleans up intervals (60s price polling)
- Supabase real-time subscriptions cleaned up on unmount
- No memory leaks from intervals or WebSocket connections

### New Optimizations Added (This Session)

✅ **Explicit Prefetch on Navigation Links**
- Desktop sidebar nav now uses `<Link prefetch={true}>` instead of `<a>` tags
- Mobile bottom nav now has `prefetch={true}` explicitly set
- Enables Next.js to preload page resources on hover/interaction
- Should reduce perceived lag on navigation between pages

## Performance Best Practices Already in Place

1. **Code Splitting**
   - Heavy components lazy-loaded to reduce initial bundle size
   - Dashboard page splits ~1,200 lines of component code into separate chunks

2. **Loading States**
   - All major routes have loading.tsx files
   - Instant visual feedback prevents blank screens
   - Skeleton UI matches final layout to prevent layout shift

3. **Resource Cleanup**
   - All intervals and subscriptions properly cleaned up
   - No memory leaks that would accumulate during navigation

## Potential Future Optimizations (Not Implemented)

These could be considered if mobile performance is still an issue:

1. **Data Caching/SWR**
   - OrbSignalsCard and OrbClient fetch on every mount
   - Could use SWR or React Query for stale-while-revalidate caching
   - Would reduce API calls and improve perceived speed

2. **Bundle Analysis**
   - Run `next build` with bundle analyzer to identify large dependencies
   - Check if any heavy libraries (charts, etc.) could be code-split further

3. **Image Optimization**
   - Audit for unoptimized images (already using next/image in most places)
   - Consider using `priority` prop on above-the-fold images

4. **Progressive Enhancement**
   - Consider showing cached data immediately, then refresh in background
   - Use `startTransition` for non-urgent updates

## Testing Recommendations

To verify the improvements:

1. Test on actual mobile device (not just DevTools mobile emulation)
2. Use Lighthouse in Chrome DevTools to measure performance scores
3. Test navigation: Dashboard → Orb → Dashboard (the reported slow path)
4. Check Network tab to verify prefetch is working (should see prefetch requests)
5. Test on slow 3G connection to simulate worst-case scenario

## Conclusion

Most of the critical mobile performance optimizations were already implemented in previous work. The new prefetch additions should provide a small but noticeable improvement in navigation speed, especially on slower networks. If significant lag persists, the next step would be implementing client-side caching (SWR/React Query) for the API data fetches.
