"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { BroadcastAlert, Report, VolunteerProfile } from "@/lib/types";

export function useReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "reports"), orderBy("createdAt", "desc")),
      (snapshot) => {
        setReports(snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Report) })));
        setLoading(false);
      },
      () => setLoading(false),
    );

    return unsubscribe;
  }, []);

  return { reports, loading };
}

export function useVolunteers() {
  const [volunteers, setVolunteers] = useState<VolunteerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "volunteers"),
      (snapshot) => {
        setVolunteers(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as VolunteerProfile),
          })),
        );
        setLoading(false);
      },
      () => setLoading(false),
    );

    return unsubscribe;
  }, []);

  return { volunteers, loading };
}

export function useBroadcastAlerts(limitCount = 3) {
  const [alerts, setAlerts] = useState<BroadcastAlert[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "broadcasts"), orderBy("createdAt", "desc")),
      (snapshot) => {
        setAlerts(
          snapshot.docs
            .map((doc) => ({ id: doc.id, ...(doc.data() as BroadcastAlert) }))
            .slice(0, limitCount),
        );
      },
      () => setAlerts([]),
    );

    return unsubscribe;
  }, [limitCount]);

  return alerts;
}
