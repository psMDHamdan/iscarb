"use client";

import { motion } from "framer-motion";
import { Briefcase, Building, MapPin, Target, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { PageHeader } from "@/components/iscarb/PageHeader";

export function CareerMatchView() {
  const { lang } = useApp();
  const { t, ar } = useI18n();

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const jobs = [
    {
      id: 1,
      title: "Data Analyst",
      company: "Saudi Aramco",
      location: "Dhahran, SA",
      match: 92,
      tags: ["Python", "Data Visualization", "SQL"],
    },
    {
      id: 2,
      title: "Software Engineer",
      company: "stc",
      location: "Riyadh, SA",
      match: 88,
      tags: ["React", "Node.js", "Cloud Architecture"],
    },
    {
      id: 3,
      title: "Product Manager (Associate)",
      company: "Elm",
      location: "Riyadh, SA",
      match: 75,
      tags: ["Agile", "Strategy", "User Research"],
    },
  ];

  return (
    <>
      <PageHeader
        title={ar ? "المطابقة الوظيفية" : "Career Match"}
        description={ar ? "اكتشف الوظائف التي تتطابق مع كفاءاتك ومهاراتك." : "Discover careers that match your skills and readiness profile."}
        breadcrumbs={[
          { label: ar ? "الرئيسية" : "Dashboard", href: "/student/dashboard" },
          { label: ar ? "المطابقة الوظيفية" : "Career Match", href: "/student/career-explorer" },
        ]}
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-5xl space-y-6 pb-12"
      >
        <div className="grid gap-6">
          {jobs.map((job) => (
            <motion.div key={job.id} variants={item}>
              <Card className="overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm transition-all hover:shadow-md hover:border-iscarb-green/30">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Match Score Section */}
                    <div className="flex md:w-48 flex-col items-center justify-center border-b border-border/50 bg-muted/20 p-6 md:border-b-0 md:border-r">
                      <div className="relative flex size-20 items-center justify-center rounded-full border-4 border-iscarb-green/20">
                        <div 
                          className="absolute inset-0 rounded-full border-4 border-iscarb-green"
                          style={{ clipPath: `polygon(0 0, 100% 0, 100% ${job.match}%, 0 ${job.match}%)` }}
                        />
                        <div className="flex flex-col items-center">
                          <span className="font-display text-xl font-bold text-foreground">{job.match}%</span>
                        </div>
                      </div>
                      <span className="mt-2 text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center">
                        <Target className="mr-1 size-3" />
                        {ar ? "نسبة التطابق" : "Match Score"}
                      </span>
                    </div>

                    {/* Job Details Section */}
                    <div className="flex flex-1 flex-col justify-between p-6">
                      <div>
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div>
                            <h3 className="font-display text-xl font-bold">{job.title}</h3>
                            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center">
                                <Building className="mr-1.5 size-4" />
                                {job.company}
                              </span>
                              <span className="flex items-center">
                                <MapPin className="mr-1.5 size-4" />
                                {job.location}
                              </span>
                            </div>
                          </div>
                          <Button className="shrink-0 bg-iscarb-green hover:bg-iscarb-green-dark">
                            {ar ? "التقديم الآن" : "Apply Now"}
                            <ExternalLink className="ml-2 size-4" />
                          </Button>
                        </div>
                        
                        <div className="mt-4 flex flex-wrap gap-2">
                          {job.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </>
  );
}
